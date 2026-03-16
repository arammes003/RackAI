# Test directo - sin emojis para evitar problemas de encoding
import pdfplumber
import requests
import pandas as pd
import re
import io


def _safe_float(val):
    if not val or val.strip().upper() == "X":
        return None
    return float(val.replace(",", "."))


def parse_clasificacion_pdf(pdf_url):
    response = requests.get(pdf_url, timeout=30)
    response.raise_for_status()
    pdf_bytes = io.BytesIO(response.content)

    rows = []
    current_category = ""
    current_gender = ""

    NUM = r"[\d]+[.,]?\d*"
    ATTEMPT = r"(?:[\d]+[.,]?\d*|X)"

    result_line_pattern = re.compile(
        r"^(\d{1,3})\s+"
        r"(.+?)\s+"
        r"(\d{4})\s+"
        r"([A-Za-z]{2,8})\s+"
        r"(" + NUM + r")\s+"
        r"(" + NUM + r")\s+"
        r"(\d+)\s+"
        r"(" + ATTEMPT + r")\s+"
        r"(" + ATTEMPT + r")\s+"
        r"(" + ATTEMPT + r")\s+"
        r"(\d+)\s+"
        r"(" + ATTEMPT + r")\s+"
        r"(" + ATTEMPT + r")\s+"
        r"(" + ATTEMPT + r")\s+"
        r"(\d+)\s+"
        r"(" + ATTEMPT + r")\s+"
        r"(" + ATTEMPT + r")\s+"
        r"(" + ATTEMPT + r")\s+"
        r"(\d+)\s+"
        r"(" + NUM + r")\s+"
        r"(" + NUM + r")"
        r"(?:\s+(\d+))?"
    )

    weight_class_pattern = re.compile(r"^[-+]?\d+\s*kg$", re.IGNORECASE)
    gender_pattern = re.compile(r"^(HOMBRES|MUJERES|MEN|WOMEN)\s+(.*)", re.IGNORECASE)
    discipline_pattern = re.compile(
        r"^(HOMBRES|MUJERES|MEN|WOMEN|SUB[ -]?\d+|JUNIOR|SENIOR|MASTER|OPEN|"
        r"EQUIPADO|RAW|CLASSIC|ABSOLUT[OA]|PRESS\s+BANCA|MASCULINO|FEMENINO)",
        re.IGNORECASE,
    )

    with pdfplumber.open(pdf_bytes) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue
            for line in text.split("\n"):
                line = line.strip()
                if not line:
                    continue
                if any(
                    line.startswith(s)
                    for s in [
                        "LEVANTADOR",
                        "Pagina",
                        "ASOCIACION",
                        "EUROPEAN",
                        "Rev.",
                        "Campeonato",
                        "AEP-",
                        "CLASIFICACION",
                        "MEJORES",
                        "ABREVIACIONES",
                    ]
                ):
                    continue
                # version con acentos tambien
                if any(
                    line.startswith(s)
                    for s in ["LEVANTADORA", "ASOCIACI", "Campeona", "CLASIFICACI"]
                ):
                    continue
                if line.startswith("Pagina") or "gina " in line[:12]:
                    continue
                if line.startswith("--") or line.startswith("=="):
                    continue
                if (
                    line.startswith("I Copa")
                    or line.startswith("Burdeos")
                    or line.startswith("Ibi,")
                ):
                    continue
                if (
                    line.startswith("—")
                    or line.startswith("–")
                    or line.startswith(chr(8212))
                ):
                    continue

                if gender_pattern.match(line):
                    current_gender = line.strip()
                    continue
                if weight_class_pattern.match(line):
                    current_category = line.strip()
                    continue
                if discipline_pattern.match(line) and not re.match(r"^\d", line):
                    current_gender = line.strip()
                    continue

                match = result_line_pattern.match(line)
                if match:
                    g = match.groups()
                    rows.append(
                        {
                            "posicion": int(g[0]),
                            "nombre": g[1].strip(),
                            "anio_nacimiento": int(g[2]),
                            "club": g[3],
                            "peso_corporal": _safe_float(g[4]),
                            "coeficiente": _safe_float(g[5]),
                            "orden": int(g[6]),
                            "sq1": _safe_float(g[7]),
                            "sq2": _safe_float(g[8]),
                            "sq3": _safe_float(g[9]),
                            "sq_rank": int(g[10]),
                            "bp1": _safe_float(g[11]),
                            "bp2": _safe_float(g[12]),
                            "bp3": _safe_float(g[13]),
                            "bp_rank": int(g[14]),
                            "dl1": _safe_float(g[15]),
                            "dl2": _safe_float(g[16]),
                            "dl3": _safe_float(g[17]),
                            "dl_rank": int(g[18]),
                            "total": _safe_float(g[19]),
                            "ipf_gl": _safe_float(g[20]),
                            "puntos": int(g[21]) if g[21] else None,
                            "genero_disciplina": current_gender,
                            "categoria_peso": current_category,
                        }
                    )

    return pd.DataFrame(rows)


# ========== TEST ==========
test_urls = [
    (
        "CTO ESPANA JUNIOR MAS",
        "https://powerliftingspain.es/wp-content/uploads/2024/01/Clasificaciones_MAS_AEP-1_JUNIOR_Ibi_Alicante_2023_2024-01-10-1.pdf",
    ),
    (
        "CTO ESPANA JUNIOR FEM",
        "https://powerliftingspain.es/wp-content/uploads/2023/12/Clasificacion_FEM_AEP-1_JUNIOR_Ibi_Alicante_2023-12-08.pdf",
    ),
    (
        "COPA PIRINEOS FEM (prev. OK)",
        "https://powerliftingspain.es/wp-content/uploads/2023/02/Clasificaciones_EPF_Copa_Pirineos_Burdeos_FEM_2023-02-06.pdf",
    ),
]

for name, url in test_urls:
    print(f"\n{'=' * 70}")
    print(f"[TEST] {name}")
    df = parse_clasificacion_pdf(url)
    print(f"  -> {len(df)} atletas parseados")

    if not df.empty:
        cats = df["categoria_peso"].unique()
        print(f"  -> Categorias peso: {list(cats)}")
        genders = df["genero_disciplina"].unique()
        print(f"  -> Genero/disciplina: {list(genders)}")

        for cat in cats[:5]:
            cat_df = df[df["categoria_peso"] == cat]
            print(f"\n  [{cat}] ({len(cat_df)} atletas)")
            for _, r in cat_df.head(2).iterrows():
                total = r["total"] if r["total"] else 0
                gl = r["ipf_gl"] if r["ipf_gl"] else 0
                bw = r["peso_corporal"] if r["peso_corporal"] else 0
                print(
                    f"    {r['posicion']:>2}. {r['nombre']:<28} "
                    f"{r['club']:>6} {bw:>6.1f}kg "
                    f"TOT:{total:>6.1f}  GL:{gl:>6.2f}"
                )
            if len(cat_df) > 2:
                print(f"    ... +{len(cat_df) - 2} mas")

        fname = (
            name.replace(" ", "_").replace("(", "").replace(")", "").replace(".", "")
            + ".csv"
        )
        df.to_csv(f"C:/tmp/{fname}", index=False)
        print(f"\n  CSV guardado: C:/tmp/{fname}")
    else:
        print("  SIN RESULTADOS - debug:")
        resp = requests.get(url, timeout=30)
        with pdfplumber.open(io.BytesIO(resp.content)) as pdf:
            text = pdf.pages[0].extract_text()
            if text:
                for line in text.split("\n")[:8]:
                    print(f"    > {line}")
