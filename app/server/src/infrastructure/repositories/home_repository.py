from supabase import create_client, Client
from dotenv import load_dotenv
import pandas as pd
from sqlalchemy import create_engine, NullPool, text
import os


class HomeRepository:
    """
    Repositorio para consultas de la página de inicio / dashboard.
    """

    def __init__(self):
        load_dotenv()

        PASSWORD = os.getenv("POSTGRES_PASSWORD")
        DATABASE_URL = f"postgresql://postgres.uvyjzlcziqusafdjqadb:{PASSWORD}@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"

        self.engine = create_engine(DATABASE_URL, poolclass=NullPool)
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get(
            "SUPABASE_PUBLISHABLE_KEY"
        )
        self.supabase: Client = create_client(url, key)

    def get_unique_athletes_per_year(self, countries=None) -> pd.DataFrame:
        """
        Retorna la cantidad de atletas únicos por año.

        :param countries: Lista de países a filtrar (opcional)
        :return: DataFrame con columnas 'year' y 'unique_athletes'
        """
        if countries is None:
            countries = ["Spain", "España", "ESP"]

        query = f"""
        SELECT
            CAST(EXTRACT(YEAR FROM competition_date) AS INTEGER) AS year,
            COUNT(DISTINCT fr.athlete_id) AS count
        FROM fact_results fr
        JOIN dim_athlete da ON fr.athlete_id = da.athlete_id
        WHERE da.country IN ({", ".join([f"'{c}'" for c in countries])})
        GROUP BY year
        ORDER BY year
        """

        df = pd.read_sql(query, self.engine)
        return df.to_dict(orient="records")

    def get_competitions_per_year(
        self, countries=None, federations=None
    ) -> pd.DataFrame:
        """
        Retorna la cantidad de competiciones por año.

        :param countries: Lista de países a filtrar (opcional)
        :param federations: Lista de federaciones a filtrar (opcional)
        :return: Lista de diccionarios con columnas 'year' y 'count'
        """

        if countries is None:
            countries = ["Spain", "España", "ESP"]
        if federations is None:
            federations = ["AEP", "EPF", "IPF"]

        query = f"""
        SELECT
            CAST(EXTRACT(YEAR FROM date) AS INTEGER) AS year,
            COUNT(*) AS count
        FROM dim_competition
        WHERE country IN ({", ".join([f"'{c}'" for c in countries])})
        AND federation IN ({", ".join([f"'{f}'" for f in federations])})
        GROUP BY CAST(EXTRACT(YEAR FROM date) AS INTEGER)
        ORDER BY year
        """

        df = pd.read_sql(query, self.engine)
        return df.to_dict(orient="records")

    def get_historical_leaderboard(
        self,
        sex: str,
        sort_by: str = "goodlift",
        limit: int = 50,
    ):

        valid_sort_columns = {"goodlift", "dots", "wilks", "glossbrenner", "total"}
        if sort_by not in valid_sort_columns:
            raise ValueError(f"sort_by debe estar en {valid_sort_columns}")

        query = f"""
        WITH ranked AS (
            SELECT
                fr.athlete_id,
                da.name AS athlete_name,
                da.image_url,

                -- métrica por la que ordenamos
                fr.{sort_by} AS best_value,

                -- contexto real del día
                fr.weight_class AS real_weight_class,
                NULL AS real_bodyweight, -- No tenemos bodyweight en SQL todavía

                -- marcas del día glorioso
                fr.squat AS best_squat,
                fr.bench AS best_bench,
                fr.deadlift AS best_deadlift,
                fr.total AS best_total,

                -- metadatos
                fr.competition_date AS date,
                dc.name AS competition_name,
                dc.federation,
                da.sex,
                
                -- para uso interno (no se devuelve al final si no se pide)
                ROW_NUMBER() OVER (
                    PARTITION BY fr.athlete_id
                    ORDER BY fr.{sort_by} DESC
                ) AS rn

            FROM fact_results fr
            JOIN dim_athlete da
                ON fr.athlete_id = da.athlete_id
            JOIN dim_competition dc
                ON fr.competition_id = dc.competition_id

            WHERE da.country IN ('Spain', 'España', 'ESP')
            AND dc.federation IN ('AEP', 'EPF', 'IPF')
            AND fr.equipment = 'Raw'
            AND fr.event = 'SBD'
            AND fr.tested = TRUE
            AND da.sex = %(sex)s
            AND fr.total > 0
        )

        SELECT 
            athlete_id AS _id,
            athlete_name,
            best_value,
            real_weight_class,
            real_bodyweight,
            best_squat,
            best_bench,
            best_deadlift,
            best_total,
            date,
            competition_name,
            federation,
            sex,
            image_url
        FROM ranked
        WHERE rn = 1
        ORDER BY best_value DESC
        LIMIT %(limit)s;
        """

        df = pd.read_sql(
            query,
            self.engine,
            params={"sex": sex, "limit": limit},
        )

        return df.to_dict(orient="records")

    def get_monthly_top_5_general(self):

        query = """
        WITH last_month_with_data AS (
            SELECT date_trunc('month', MAX(competition_date)) AS month_start
            FROM fact_results
        ),

        base AS (
            SELECT
                fr.squat,
                fr.bench,
                fr.deadlift,
                fr.total,
                fr.goodlift,
                fr.weight_class,
                fr.competition_date,
                da.sex,
                da.name AS athlete_name,
                da.image_url,
                da.country,
                dc.federation,
                dc.name AS competition_name

            FROM fact_results fr
            JOIN dim_athlete da
                ON fr.athlete_id = da.athlete_id
            JOIN dim_competition dc
                ON fr.competition_id = dc.competition_id
            CROSS JOIN last_month_with_data lm

            WHERE fr.competition_date >= lm.month_start
            AND fr.competition_date < lm.month_start + INTERVAL '1 month'
            AND UPPER(dc.federation) IN ('IPF', 'EPF', 'AEP')
            AND da.country IN ('Spain', 'España', 'ESP')
            AND fr.total > 0
        )

        -- SQUAT
        SELECT 'squat' AS type,
            sex,
            athlete_name AS athlete,
            image_url,
            squat AS value,
            federation,
            competition_name,
            weight_class,
            competition_date AS date
        FROM (
            SELECT *,
                ROW_NUMBER() OVER (
                    PARTITION BY sex
                    ORDER BY squat DESC,
                                CAST(
                                    NULLIF(
                                        regexp_replace(weight_class, '[^0-9.]', '', 'g'),
                                        ''
                                    ) AS numeric
                                ) ASC
                ) rn
            FROM base
            WHERE squat IS NOT NULL
        ) t
        WHERE rn <= 1

        UNION ALL

        -- BENCH
        SELECT 'bench',
            sex,
            athlete_name,
            image_url,
            bench,
            federation,
            competition_name,
            weight_class,
            competition_date
        FROM (
            SELECT *,
                ROW_NUMBER() OVER (
                    PARTITION BY sex
                    ORDER BY bench DESC,
                                CAST(
                                    NULLIF(
                                        regexp_replace(weight_class, '[^0-9.]', '', 'g'),
                                        ''
                                    ) AS numeric
                                ) ASC
                ) rn
            FROM base
            WHERE bench IS NOT NULL
        ) t
        WHERE rn <= 1

        UNION ALL

        -- DEADLIFT
        SELECT 'deadlift',
            sex,
            athlete_name,
            image_url,
            deadlift,
            federation,
            competition_name,
            weight_class,
            competition_date
        FROM (
            SELECT *,
                ROW_NUMBER() OVER (
                    PARTITION BY sex
                    ORDER BY deadlift DESC,
                                CAST(
                                    NULLIF(
                                        regexp_replace(weight_class, '[^0-9.]', '', 'g'),
                                        ''
                                    ) AS numeric
                                ) ASC
                ) rn
            FROM base
            WHERE deadlift IS NOT NULL
        ) t
        WHERE rn <= 1

        UNION ALL

        -- TOTAL
        SELECT 'total',
            sex,
            athlete_name,
            image_url,
            total,
            federation,
            competition_name,
            weight_class,
            competition_date
        FROM (
            SELECT *,
                ROW_NUMBER() OVER (
                    PARTITION BY sex
                    ORDER BY total DESC,
                                CAST(
                                    NULLIF(
                                        regexp_replace(weight_class, '[^0-9.]', '', 'g'),
                                        ''
                                    ) AS numeric
                                ) ASC
                ) rn
            FROM base
            WHERE total IS NOT NULL
        ) t
        WHERE rn <= 1

        UNION ALL

        -- GOODLIFT
        SELECT 'goodlift',
            sex,
            athlete_name,
            image_url,
            goodlift,
            federation,
            competition_name,
            weight_class,
            competition_date
        FROM (
            SELECT *,
                ROW_NUMBER() OVER (
                    PARTITION BY sex
                    ORDER BY goodlift DESC,
                                CAST(
                                    NULLIF(
                                        regexp_replace(weight_class, '[^0-9.]', '', 'g'),
                                        ''
                                    ) AS numeric
                                ) ASC
                ) rn
            FROM base
            WHERE goodlift IS NOT NULL
        ) t
        WHERE rn <= 1
        ;
        """

        df = pd.read_sql(query, self.engine)
        # Replace NaN with None so it becomes null in JSON
        df = df.where(pd.notnull(df), None)
        return df.to_dict(orient="records")

    def get_all_athletes(self):
        """
        Retorna una lista de todos los atletas (id y nombre) ordenados alfabéticamente.
        """
        query = """
        SELECT DISTINCT athlete_id, name
        FROM dim_athlete
        ORDER BY name ASC
        """
        df = pd.read_sql(query, self.engine)
        return df.to_dict(orient="records")

    def upload_profile_picture(
        self, athlete_id: str, file: bytes, file_name: str, content_type: str
    ):
        """
        Sube la foto de perfil al bucket 'athletes_images' de Supabase y actualiza la tabla dim_athlete.
        """
        try:
            # 1. Sanitizar nombre de archivo
            # Supabase s3 no le gustan los espacios ni caracteres especiales
            import os

            _, ext = os.path.splitext(file_name)
            if not ext:
                ext = ".jpg"  # Default fallback

            # Usamos un nombre limpio, e.g. "profile<ext>"
            # Como ya estamos dentro de una carpeta con el ID del atleta, no hace falta que el nombre sea único
            safe_file_name = f"profile{ext}"

            file_path = f"{athlete_id}/{safe_file_name}"
            bucket_name = "athletes_images"

            # Upsert para sobrescribir
            self.supabase.storage.from_(bucket_name).upload(
                path=file_path,
                file=file,
                file_options={"content-type": content_type, "upsert": "true"},
            )

            # 2. Obtener URL Pública
            public_url = self.supabase.storage.from_(bucket_name).get_public_url(
                file_path
            )

            # 3. Actualizar dim_athlete
            # Usamos text() para la consulta raw
            update_query = text(
                "UPDATE public.dim_athlete SET image_url = :url WHERE athlete_id = :id"
            )

            with self.engine.connect() as conn:
                conn.execute(update_query, {"url": public_url, "id": athlete_id})
                conn.commit()

            return public_url

        except Exception as e:
            print(f"❌ Error uploading profile picture: {e}")
            raise e


# ------------------------------
# Ejemplo de uso

if __name__ == "__main__":
    repo = HomeRepository()
    df = repo.get_monthly_top_5_general()
    print(df)
