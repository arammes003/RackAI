"""
Ingesta de competiciones AEP 2023 en Supabase.

Flujo:
1. Scrapea todas las competiciones de powerliftingspain.es/campeonatos-ano-2023
2. Inserta cada competición en dim_competition
3. Parsea los PDFs de clasificaciones
4. UPSERT atletas en dim_athlete
5. Inserta resultados en fact_results

Uso:
    py ingest_aep_2023.py
"""

import os
import re
import unicodedata
import time
import traceback
from datetime import datetime
from supabase import create_client, Client

# Importar el scraper directamente, evitando __init__.py que importa MongoDB/sqlalchemy
import importlib.util

_spec = importlib.util.spec_from_file_location(
    "powerlifting_spain_scraper",
    os.path.join(
        os.path.dirname(__file__),
        "src",
        "infrastructure",
        "scrapers",
        "powerlifting_spain_scraper.py",
    ),
)
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)
PowerliftingSpainScraper = _mod.PowerliftingSpainScraper

# ========================================================================
# Configuración Supabase
# ========================================================================
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://uvyjzlcziqusafdjqadb.supabase.co")
SUPABASE_KEY = os.getenv(
    "SUPABASE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2eWp6bGN6aXF1c2FmZGpxYWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzODQ0MzYsImV4cCI6MjA4Njk2MDQzNn0.g0FLkpcpbCGU8XGkrYc2NWmI3kQEqoPRIanbnt9bfOc",
)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ========================================================================
# Helpers
# ========================================================================
def slugify(text: str) -> str:
    """Convierte texto a slug URL-safe: 'Rosset Mathilde' -> 'rosset-mathilde'."""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text)
    return text.strip("-")


def extract_slug_from_url(url: str) -> str:
    """Extrae el slug de la URL de la competición."""
    path = url.rstrip("/").split("/")[-1]
    return path


# Mapeo de meses en español (adaptado de prueba/scrape_competitions_2020.py)
MONTH_MAPPING = {
    "ene": 1,
    "feb": 2,
    "mar": 3,
    "abr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "ago": 8,
    "sep": 9,
    "oct": 10,
    "nov": 11,
    "dic": 12,
    # Variantes largas
    "enero": 1,
    "febrero": 2,
    "marzo": 3,
    "abril": 4,
    "mayo": 5,
    "junio": 6,
    "julio": 7,
    "agosto": 8,
    "septiembre": 9,
    "octubre": 10,
    "noviembre": 11,
    "diciembre": 12,
    # Abreviaturas con punto
    "sept": 9,
}


def extract_level_from_slug(slug: str) -> str | None:
    """Extrae el nivel AEP del slug de la URL.
    'aep-1-campeonato-de-espana-junior...' -> 'AEP-1'
    'aep-2-copa-andaluza...' -> 'AEP-2'
    'epf-copa-pirineos...' -> 'EPF'
    """
    slug_upper = slug.upper()
    m = re.match(r"^(AEP)-(\d+)", slug_upper)
    if m:
        return f"AEP-{m.group(2)}"
    if slug_upper.startswith("EPF"):
        return "EPF"
    if slug_upper.startswith("IPF"):
        return "IPF"
    return None


def parse_dates_from_header(
    header_text: str, year: int = 2023
) -> tuple[datetime | None, datetime | None]:
    """Parsea fechas del texto de cabecera del PDF.

    Formatos:
    - 'Ibi, Alicante - 20 sept. - 1 oct., 2023' -> (2023-09-20, 2023-10-01)
    - 'Burdeos - 4-5 febrero, 2023' -> (2023-02-04, 2023-02-05)
    - 'Baza, Granada - 4-5 noviembre, 2023' -> (2023-11-04, 2023-11-05)
    - 'Palacios de Goda, Avila - 7-8 oct., 2023' -> (2023-10-07, 2023-10-08)
    """
    if not header_text:
        return None, None

    text = header_text.lower().replace(".", "").replace(",", "")

    # Extraer año si presente
    year_match = re.search(r"(\d{4})", text)
    if year_match:
        year = int(year_match.group(1))

    # CASE 1: Multi-mes - "20 sept - 1 oct 2023"
    multi = re.search(
        r"(\d{1,2})\s*[-]?\s*([a-záéíóúñ]+)?\s*[-–]\s*(\d{1,2})\s*[-]?\s*([a-záéíóúñ]+)",
        text,
    )
    if multi:
        d1, m1_str, d2, m2_str = multi.groups()
        m1_str = (m1_str or "").strip()[:4]
        m2_str = m2_str.strip()[:4]
        m2 = MONTH_MAPPING.get(m2_str) or MONTH_MAPPING.get(m2_str[:3])
        m1 = (
            MONTH_MAPPING.get(m1_str) or MONTH_MAPPING.get(m1_str[:3]) if m1_str else m2
        )
        if m1 and m2:
            try:
                return datetime(year, m1, int(d1)), datetime(year, m2, int(d2))
            except ValueError:
                pass

    # CASE 2: Single month range - "4-5 noviembre"
    single = re.search(r"(\d{1,2})(?:\s*-\s*(\d{1,2}))?\s+([a-záéíóúñ]+)", text)
    if single:
        d1 = int(single.group(1))
        d2 = int(single.group(2)) if single.group(2) else d1
        m_str = single.group(3).strip()[:4]
        m = MONTH_MAPPING.get(m_str) or MONTH_MAPPING.get(m_str[:3])
        if m:
            try:
                return datetime(year, m, d1), datetime(year, m, d2)
            except ValueError:
                pass

    return None, None


def extract_town_state_from_header(header_text: str) -> tuple[str | None, str | None]:
    """Extrae localidad y provincia del texto de cabecera.
    'Ibi, Alicante - 20 sept. - 1 oct., 2023' -> ('Ibi', 'Alicante')
    'Baza, Granada - 4-5 noviembre, 2023' -> ('Baza', 'Granada')
    'Palacios de Goda, Avila' -> ('Palacios de Goda', 'Avila')
    """
    if not header_text:
        return None, None

    # Quitar el año y la parte de la fecha (después del primer ' - ')
    parts = re.split(r"\s*[-–]\s*\d", header_text)
    location = parts[0].strip() if parts else header_text

    # Separar town, state
    loc_parts = location.split(",")
    if len(loc_parts) >= 2:
        return loc_parts[0].strip(), loc_parts[1].strip()
    elif loc_parts:
        return loc_parts[0].strip(), None
    return None, None


def parse_sex(genero_disciplina: str) -> str:
    """'HOMBRES POWERLIFTING RAW' -> 'M', 'MUJERES...' -> 'F'."""
    if not genero_disciplina:
        return None
    g = genero_disciplina.upper()
    if "HOMBRE" in g or "MEN" in g and "WOMEN" not in g:
        return "M"
    if "MUJER" in g or "WOMEN" in g:
        return "F"
    return None


def parse_equipment(genero_disciplina: str) -> str:
    """Extrae el tipo de equipamiento de la línea de categoría."""
    if not genero_disciplina:
        return "Raw"
    g = genero_disciplina.upper()
    if "EQUIPADO" in g or "EQUIPPED" in g:
        return "Single-ply"
    return "Raw"


def parse_event_type(genero_disciplina: str) -> str:
    """Extrae tipo de evento: SBD (powerlifting completo) o B (solo bench)."""
    if not genero_disciplina:
        return "SBD"
    g = genero_disciplina.upper()
    if "PRESS BANCA" in g or "BENCH" in g:
        return "B"
    return "SBD"


def safe_max(*vals) -> float | None:
    """Devuelve el máximo de valores no-None."""
    valid = [v for v in vals if v is not None and v > 0]
    return max(valid) if valid else None


def extract_age_class(genero_disciplina: str) -> str:
    """Extrae la clase de edad de la línea de categoría.
    'HOMBRES POWERLIFTING RAW' en una competición Junior -> 'Junior'
    """
    if not genero_disciplina:
        return None
    g = genero_disciplina.upper()
    if "SUBJUNIOR" in g or "SUB-JUNIOR" in g or "SUB JUNIOR" in g:
        return "Sub-Juniors"
    if "JUNIOR" in g:
        return "Juniors"
    if "MASTER" in g:
        return "Masters"
    if "SENIOR" in g or "ABSOLUT" in g:
        return "Open"
    return None


# ========================================================================
# Inserción en Supabase
# ========================================================================
def upsert_competition(comp_data: dict) -> dict:
    """
    Inserta o actualiza una competición en dim_competition.
    Retorna dict con 'id', 'start_date', 'end_date'.
    """
    slug = extract_slug_from_url(comp_data["url"])
    level = extract_level_from_slug(slug)

    # Parsear fechas y ubicación del header del PDF
    header = comp_data.get("pdf_header", "")
    start_date, end_date = parse_dates_from_header(header)
    town, state = extract_town_state_from_header(header)

    record = {
        "slug": slug,
        "name": comp_data["titulo"],
        "federation": "AEP",
        "country": "Spain",
        "status": "completed",
        "poster_url": comp_data.get("poster_url"),
        "level": level,
    }

    if start_date:
        record["start_date"] = start_date.isoformat()
    if end_date:
        record["end_date"] = end_date.isoformat()
    if town:
        record["town"] = town
    if state:
        record["state"] = state

    # Intentar extraer registration_url de los docs
    for doc in comp_data.get("documentos", []):
        if "inscripci" in doc.lower():
            record["registration_url"] = doc
            break

    result = (
        supabase.table("dim_competition").upsert(record, on_conflict="slug").execute()
    )

    return {
        "id": result.data[0]["id"],
        "start_date": start_date,
        "end_date": end_date,
    }


# Cache local de athlete slugs -> UUIDs para evitar queries repetidas
_athlete_cache: dict[str, str] = {}


def upsert_athlete(nombre: str, sex: str) -> str:
    """
    Inserta o busca un atleta en dim_athlete por slug.
    Usa UPSERT atómico + cache local.
    Retorna el UUID del atleta.
    """
    slug = slugify(nombre)

    # Primero mirar la cache local
    if slug in _athlete_cache:
        return _athlete_cache[slug]

    # UPSERT atómico: inserta si no existe, devuelve el existente si ya está
    record = {
        "slug": slug,
        "name": nombre,
        "sex": sex,
        "country": "Spain",
    }

    try:
        result = (
            supabase.table("dim_athlete").upsert(record, on_conflict="slug").execute()
        )
        athlete_id = result.data[0]["id"]
    except Exception:
        # Si el upsert falla, intentar buscar por slug
        existing = (
            supabase.table("dim_athlete")
            .select("id")
            .eq("slug", slug)
            .limit(1)
            .execute()
        )
        if existing.data:
            athlete_id = existing.data[0]["id"]
        else:
            raise

    _athlete_cache[slug] = athlete_id
    return athlete_id


def insert_results_batch(results: list[dict]) -> int:
    """Inserta resultados en fact_results en mini-batches resilientes.
    Si un batch falla, intenta insertar uno por uno para no perder el resto.
    Retorna el numero de resultados insertados.
    """
    if not results:
        return 0

    inserted = 0
    batch_size = 50  # Batches pequeños para minimizar pérdida en fallo

    for i in range(0, len(results), batch_size):
        batch = results[i : i + batch_size]
        try:
            supabase.table("fact_results").insert(batch).execute()
            inserted += len(batch)
        except Exception as e:
            # Si falla el batch, insertar uno por uno
            print(f"    WARN: Batch falló ({e}), insertando uno a uno...")
            for record in batch:
                try:
                    supabase.table("fact_results").insert(record).execute()
                    inserted += 1
                except Exception as e2:
                    print(f"    ERR resultado individual: {e2}")

    return inserted


# ========================================================================
# Flujo Principal
# ========================================================================
def run_ingestion():
    scraper = PowerliftingSpainScraper()

    print("=" * 70)
    print("INGESTA AEP 2023 -> SUPABASE")
    print("=" * 70)

    # 1. Obtener todos los enlaces de competiciones
    print("\n[1/4] Scrapeando enlaces de competiciones 2023...")
    comp_links = scraper.get_all_competition_links()
    print(f"      Encontradas {len(comp_links)} competiciones")

    total_results = 0
    failed_comps = []

    for idx, link in enumerate(comp_links, 1):
        print(f"\n[2/4] Competicion {idx}/{len(comp_links)}: {link}")

        try:
            # 2. Scrapear detalle de la competición
            comp_data = scraper.scrape_competition_detail(link)
            print(f"      Titulo: {comp_data['titulo']}")
            print(f"      Poster: {'SI' if comp_data.get('poster_url') else 'NO'}")
            print(f"      PDFs clasificacion: {len(comp_data['clasificaciones'])}")

            # 2b. Extraer header del primer PDF de clasificación para fechas/ubicación
            if comp_data["clasificaciones"]:
                try:
                    import pdfplumber
                    import io
                    import requests as req

                    first_pdf_url = comp_data["clasificaciones"][0]
                    resp = req.get(first_pdf_url, timeout=30)
                    resp.raise_for_status()
                    with pdfplumber.open(io.BytesIO(resp.content)) as pdf:
                        first_page_text = pdf.pages[0].extract_text() or ""
                        # El header suele estar en las primeras 5 líneas
                        header_lines = first_page_text.split("\n")[:5]
                        comp_data["pdf_header"] = " ".join(header_lines)
                        print(f"      Header PDF: {comp_data['pdf_header'][:100]}...")
                except Exception as e:
                    print(f"      WARN: No se pudo extraer header del PDF: {e}")
                    comp_data["pdf_header"] = ""
            else:
                comp_data["pdf_header"] = ""

            # 3. Insertar competición en dim_competition
            comp_result = upsert_competition(comp_data)
            competition_id = comp_result["id"]
            comp_end_date = comp_result["end_date"]
            comp_start_date = comp_result["start_date"]
            # competition_date para fact_results: end_date si existe, sino start_date
            comp_date_for_results = comp_end_date or comp_start_date

            slug = extract_slug_from_url(link)
            level = extract_level_from_slug(slug)
            print(f"      -> ID: {competition_id}, Level: {level}")
            if comp_start_date:
                print(
                    f"      -> Fechas: {comp_start_date.date()} - {comp_end_date.date() if comp_end_date else '?'}"
                )

            if not comp_data["clasificaciones"]:
                print("      (Sin clasificaciones, saltando)")
                time.sleep(1)
                continue

            # 4. Parsear cada PDF de clasificación
            for pdf_url in comp_data["clasificaciones"]:
                print(f"\n      Parseando: {pdf_url.split('/')[-1]}")
                try:
                    df = scraper.parse_clasificacion_pdf(pdf_url)
                except Exception as e:
                    print(f"      ERROR parseando PDF: {e}")
                    continue

                if df.empty:
                    print("      (Sin resultados en este PDF)")
                    continue

                print(f"      -> {len(df)} resultados encontrados")

                # 5. Procesar cada resultado
                results_batch = []
                for _, row in df.iterrows():
                    sex = parse_sex(row.get("genero_disciplina", ""))

                    # UPSERT atleta
                    try:
                        athlete_id = upsert_athlete(row["nombre"], sex)
                    except Exception as e:
                        print(
                            f"      WARN: No se pudo insertar atleta '{row['nombre']}': {e}"
                        )
                        continue

                    # Calcular mejores levantamientos
                    best_sq = safe_max(row.get("sq1"), row.get("sq2"), row.get("sq3"))
                    best_bp = safe_max(row.get("bp1"), row.get("bp2"), row.get("bp3"))
                    best_dl = safe_max(row.get("dl1"), row.get("dl2"), row.get("dl3"))

                    # Calcular edad aproximada
                    age = None
                    if row.get("anio_nacimiento"):
                        age = 2023 - row["anio_nacimiento"]

                    result_record = {
                        "athlete_id": athlete_id,
                        "competition_id": competition_id,
                        "competition_date": comp_date_for_results.isoformat()
                        if comp_date_for_results
                        else None,
                        "bodyweight": row.get("peso_corporal"),
                        "club": row.get("club"),
                        "division": sex,
                        "age": age,
                        "age_class": extract_age_class(
                            row.get("genero_disciplina", "")
                        ),
                        "weight_class": row.get("categoria_peso", ""),
                        "equipment": parse_equipment(row.get("genero_disciplina", "")),
                        "event_type": parse_event_type(
                            row.get("genero_disciplina", "")
                        ),
                        "tested": True,
                        "squat_1": row.get("sq1"),
                        "squat_2": row.get("sq2"),
                        "squat_3": row.get("sq3"),
                        "squat_rank": row.get("sq_rank"),
                        "best_squat": best_sq,
                        "bench_1": row.get("bp1"),
                        "bench_2": row.get("bp2"),
                        "bench_3": row.get("bp3"),
                        "bench_rank": row.get("bp_rank"),
                        "best_bench": best_bp,
                        "deadlift_1": row.get("dl1"),
                        "deadlift_2": row.get("dl2"),
                        "deadlift_3": row.get("dl3"),
                        "deadlift_rank": row.get("dl_rank"),
                        "best_deadlift": best_dl,
                        "total": row.get("total"),
                        "place": str(int(row["posicion"]))
                        if row.get("posicion")
                        else None,
                        "team_points": row.get("puntos"),
                        "goodlift": row.get("ipf_gl"),
                    }

                    results_batch.append(result_record)

                # 6. Insertar resultados en batch (resiliente)
                if results_batch:
                    n = insert_results_batch(results_batch)
                    total_results += n
                    print(f"      -> {n}/{len(results_batch)} resultados insertados")

            time.sleep(2)  # Pausa entre competiciones

        except Exception as e:
            print(f"      ERROR GENERAL: {e}")
            failed_comps.append({"url": link, "error": str(e)})
            traceback.print_exc()

    # 7. Resumen final
    print("\n" + "=" * 70)
    print("RESUMEN DE INGESTA")
    print("=" * 70)
    print(f"  Competiciones procesadas: {len(comp_links)}")
    print(f"  Resultados insertados:    {total_results}")
    print(f"  Errores:                  {len(failed_comps)}")
    if failed_comps:
        print("\n  Competiciones fallidas:")
        for fc in failed_comps:
            print(f"    - {fc['url']}: {fc['error']}")

    # 8. Log en etl_sync_logs
    try:
        supabase.table("etl_sync_logs").insert(
            {
                "scraper_name": "powerlifting_spain_2023",
                "rows_processed": total_results,
                "status": "success" if not failed_comps else "partial",
                "error_message": str(failed_comps) if failed_comps else None,
            }
        ).execute()
        print("\n  Log guardado en etl_sync_logs")
    except Exception as e:
        print(f"\n  WARN: No se pudo guardar log: {e}")


if __name__ == "__main__":
    run_ingestion()
