import os
import uuid
import traceback
from datetime import datetime, timezone
from bson.objectid import ObjectId # Importante para la extracción incremental
from dotenv import load_dotenv
import pandas as pd
import numpy as np
from pymongo import MongoClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.dialects.postgresql import insert

# ==========================================
# CONFIGURACIÓN INICIAL
# ==========================================
load_dotenv()

MONGO_URI = (
    f"mongodb://{os.getenv('MONGO_ROOT_USERNAME')}:{os.getenv('MONGO_ROOT_PASSWORD')}@"
    f"{os.getenv('MONGO_HOST')}:{os.getenv('MONGO_PORT')}/"
)
POSTGRES_URI = f"postgresql://postgres.uvyjzlcziqusafdjqadb:{os.getenv('POSTGRES_PASSWORD')}@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"

VALID_FEDERATIONS = {"AEP", "IPF", "EPF"}
SCRAPER_NAME = "mongo_to_postgres_sync" # Identificador para nuestros logs

# ==========================================
# CAPA 1: EXTRACCIÓN (Extract)
# ==========================================
class MongoExtractor:
    def __init__(self, uri: str, db_name: str):
        self.client = MongoClient(uri)
        self.db = self.client[db_name]

    def fetch_new_results(self, last_watermark: datetime | None):
        """
        Extrae SOLO los documentos insertados en Mongo después de la marca de agua.
        Usa el ObjectId para inferir el momento exacto de creación.
        """
        query = {}
        if last_watermark:
            print(f"[Extractor] Buscando nuevos registros a partir de: {last_watermark}")
            # El ObjectId de Mongo contiene un timestamp de 4 bytes. 
            # Generamos un ObjectId "dummy" con la fecha de nuestra última sincronización.
            dummy_id = ObjectId.from_datetime(last_watermark)
            query = {"_id": {"$gt": dummy_id}}
        else:
            print("[Extractor] No hay logs previos. Extrayendo TODO el histórico de MongoDB...")

        return self.db.results.find(query)


# ==========================================
# CAPA 2: TRANSFORMACIÓN (Transform)
# (Se mantiene idéntica, con la limpieza de país incluida)
# ==========================================
class DataTransformer:
    def __init__(self, existing_athletes: dict, existing_comps: dict):
        self.athletes_dict = {}
        self.competitions_dict = {}
        self.facts_list = []
        self.athlete_slug_to_uuid = existing_athletes
        self.comp_slug_to_uuid = existing_comps

    def _parse_date(self, date_obj) -> datetime | None:
        if isinstance(date_obj, datetime):
            return date_obj
        if isinstance(date_obj, str):
            try:
                return datetime.fromisoformat(date_obj.replace("Z", "+00:00"))
            except ValueError:
                return None
        return None

    def _get_or_create_athlete_uuid(self, slug: str) -> str:
        if slug not in self.athlete_slug_to_uuid:
            self.athlete_slug_to_uuid[slug] = str(uuid.uuid4())
            return self.athlete_slug_to_uuid[slug], True
        return self.athlete_slug_to_uuid[slug], False

    def _get_or_create_comp_uuid(self, slug: str) -> str:
        if slug not in self.comp_slug_to_uuid:
            self.comp_slug_to_uuid[slug] = str(uuid.uuid4())
            return self.comp_slug_to_uuid[slug], True
        return self.comp_slug_to_uuid[slug], False

    def process_record(self, record: dict):
        competition = record.get("competition", {})
        federation = competition.get("federation")

        if federation not in VALID_FEDERATIONS:
            return

        athlete = record.get("athlete", {})
        category = record.get("category", {})
        results = record.get("results", {})
        points = record.get("points", {})

        athlete_slug = athlete.get("id")
        comp_slug = competition.get("id")

        if not athlete_slug or not comp_slug:
            return

        comp_date = self._parse_date(competition.get("date"))

        athlete_uuid, is_new_athlete = self._get_or_create_athlete_uuid(athlete_slug)
        comp_uuid, is_new_comp = self._get_or_create_comp_uuid(comp_slug)

        athlete_country = athlete.get("country")

        if (
            not athlete_country
            or pd.isna(athlete_country)
            or str(athlete_country).strip() == ""
            or str(athlete_country).strip().lower() == "nan"
        ) and federation == "AEP":
            athlete_country = "Spain"

        if is_new_athlete and athlete_uuid not in self.athletes_dict:
            self.athletes_dict[athlete_uuid] = {
                "id": athlete_uuid,
                "slug": athlete_slug,
                "name": athlete.get("name"),
                "sex": athlete.get("sex"),
                "country": athlete_country,
                "image_url": "",
            }
        elif athlete_uuid in self.athletes_dict:
            current_country = self.athletes_dict[athlete_uuid].get("country")
            if (
                not current_country
                or pd.isna(current_country)
                or str(current_country).strip() == ""
                or str(current_country).strip().lower() == "nan"
            ) and athlete_country:
                self.athletes_dict[athlete_uuid]["country"] = athlete_country

        if is_new_comp and comp_uuid not in self.competitions_dict:
            self.competitions_dict[comp_uuid] = {
                "id": comp_uuid,
                "slug": comp_slug,
                "name": competition.get("name"),
                "date": comp_date,
                "federation": federation,
                "country": competition.get("country"),
                "state": competition.get("state"),
                "town": competition.get("town"),
            }

        raw_place = results.get("place")
        self.facts_list.append(
            {
                "athlete_id": athlete_uuid,
                "competition_id": comp_uuid,
                "competition_date": comp_date,
                "age": athlete.get("age"),
                "bodyweight": category.get("bodyweight"),
                "division": category.get("division"),
                "age_class": category.get("age_class"),
                "weight_class": category.get("weight_class"),
                "equipment": category.get("equipment"),
                "event_type": category.get("event"),
                "tested": category.get("tested"),
                "squat": results.get("squat"),
                "bench": results.get("bench"),
                "deadlift": results.get("deadlift"),
                "total": results.get("total"),
                "place": str(raw_place) if raw_place else None,
                "dots": points.get("dots", 0.0),
                "wilks": points.get("wilks", 0.0),
                "goodlift": points.get("goodlift", 0.0),
                "glossbrenner": points.get("glossbrenner", 0.0),
            }
        )

    def get_dataframes(self):
        df_athletes = pd.DataFrame(list(self.athletes_dict.values()))
        df_comps = pd.DataFrame(list(self.competitions_dict.values()))
        df_facts = pd.DataFrame(self.facts_list)

        df_athletes = df_athletes.replace({np.nan: None})
        df_comps = df_comps.replace({np.nan: None})
        df_facts = df_facts.replace({np.nan: None})

        return df_athletes, df_comps, df_facts


# ==========================================
# CAPA 3: CARGA (Load) Y GESTIÓN DE LOGS
# ==========================================
class PostgresLoader:
    def __init__(self, uri: str):
        self.engine: Engine = create_engine(uri)

    # --- NUEVAS FUNCIONES DE AUDITORÍA (WATERMARK) ---
    def get_last_watermark(self, scraper_name: str) -> datetime | None:
        """Obtiene la fecha de la última ejecución exitosa del scraper."""
        with self.engine.connect() as conn:
            query = text("""
                SELECT watermark_timestamp 
                FROM etl_sync_logs 
                WHERE scraper_name = :scraper_name AND status = 'success'
                ORDER BY created_at DESC LIMIT 1
            """)
            result = conn.execute(query, {"scraper_name": scraper_name}).scalar()
            return result

    def log_execution(self, scraper_name: str, watermark: datetime, rows: int, status: str, error_msg: str = None):
        """Registra el resultado de la ejecución en la tabla de auditoría."""
        with self.engine.connect() as conn:
            query = text("""
                INSERT INTO etl_sync_logs (scraper_name, watermark_timestamp, rows_processed, status, error_message)
                VALUES (:scraper_name, :watermark, :rows, :status, :error_message)
            """)
            conn.execute(query, {
                "scraper_name": scraper_name,
                "watermark": watermark,
                "rows": rows,
                "status": status,
                "error_message": error_msg
            })
            conn.commit()

    # --------------------------------------------------

    def fetch_existing_mappings(self):
        print("[Loader] Sincronizando estado actual de Supabase...")
        with self.engine.connect() as conn:
            athletes = dict(conn.execute(text("SELECT slug, id FROM dim_athlete")).fetchall())
            comps = dict(conn.execute(text("SELECT slug, id FROM dim_competition")).fetchall())
        return athletes, comps

    def upsert_dataframe(self, df: pd.DataFrame, table_name: str, unique_columns: list):
        if df.empty:
            return

        def insert_on_conflict_nothing(table, conn, keys, data_iter):
            data = [dict(zip(keys, row)) for row in data_iter]
            stmt = insert(table.table).values(data)
            do_nothing_stmt = stmt.on_conflict_do_nothing(index_elements=unique_columns)
            result = conn.execute(do_nothing_stmt)
            return result.rowcount

        df.to_sql(
            table_name,
            self.engine,
            if_exists="append",
            index=False,
            method=insert_on_conflict_nothing,
            chunksize=2000,
        )


# ==========================================
# ORQUESTADOR (Main)
# ==========================================
def run_pipeline():
    loader = PostgresLoader(POSTGRES_URI)
    
    # 0. Capturar el instante exacto de inicio (Será nuestra próxima marca de agua)
    current_execution_time = datetime.now(timezone.utc)
    
    try:
        # 1. Obtener la Marca de Agua (Última vez que se corrió exitosamente)
        last_watermark = loader.get_last_watermark(SCRAPER_NAME)
        
        # 2. Leer estado actual
        existing_athletes, existing_comps = loader.fetch_existing_mappings()
        print(f"-> {len(existing_athletes)} atletas y {len(existing_comps)} competiciones ya en Postgres.")

        # 3. Inicializar módulos
        extractor = MongoExtractor(MONGO_URI, "RackAI")
        transformer = DataTransformer(existing_athletes, existing_comps)

        # 4. Extraer (Filtrado por fecha) y Transformar
        cursor = extractor.fetch_new_results(last_watermark)
        
        count = 0
        for record in cursor:
            transformer.process_record(record)
            count += 1
            if count % 5000 == 0:
                print(f"[Transformer] {count} documentos procesados...")

        if count == 0:
            print("✅ No hay registros nuevos en MongoDB desde la última sincronización.")
            # Registramos que corrimos con éxito, pero sin filas nuevas
            loader.log_execution(SCRAPER_NAME, current_execution_time, 0, 'success')
            return

        df_athletes, df_comps, df_facts = transformer.get_dataframes()

        print(f"-> Nuevos Atletas a insertar: {len(df_athletes)}")
        print(f"-> Nuevas Competiciones a insertar: {len(df_comps)}")
        print(f"-> Total Resultados evaluados: {len(df_facts)}")

        # 5. Cargar (Upsert)
        print("[Loader] Realizando Inserción Incremental...")
        loader.upsert_dataframe(df_athletes, "dim_athlete", unique_columns=["slug"])
        loader.upsert_dataframe(df_comps, "dim_competition", unique_columns=["slug"])

        loader.upsert_dataframe(
            df_facts,
            "fact_results",
            unique_columns=["athlete_id", "competition_id", "event_type", "equipment"],
        )

        # 6. Enriquecimiento Retroactivo (Post-Carga)
        print("[Loader] Ejecutando enriquecimiento retroactivo para atletas de AEP...")
        with loader.engine.connect() as conn:
            conn.execute(
                text("""
                UPDATE dim_athlete da
                SET country = 'Spain'
                FROM fact_results fr
                JOIN dim_competition dc ON fr.competition_id = dc.id
                WHERE da.id = fr.athlete_id
                  AND dc.federation = 'AEP'
                  AND (da.country IS NULL OR da.country = '' OR da.country ILIKE 'nan')
            """)
            )
            conn.commit()

        # 7. REGISTRAR EL ÉXITO EN LA TABLA DE AUDITORÍA
        loader.log_execution(SCRAPER_NAME, current_execution_time, count, 'success')
        print("✅ CARGA INCREMENTAL Y LOG COMPLETADOS CON ÉXITO")

    except Exception as e:
        # En caso de fallo crítico, guardamos el error en Postgres para poder investigarlo
        print(f"❌ FALLO CRÍTICO EN EL PIPELINE: {e}")
        error_trace = traceback.format_exc()
        loader.log_execution(SCRAPER_NAME, current_execution_time, 0, 'failed', error_trace)
        raise e


if __name__ == "__main__":
    run_pipeline()