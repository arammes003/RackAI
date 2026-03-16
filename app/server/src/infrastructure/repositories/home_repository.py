from datetime import datetime
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

        # # def get_unique_athletes_per_year(self, countries=None) -> pd.DataFrame:
        # """
        # Retorna la cantidad de atletas únicos por año.

        # :param countries: Lista de países a filtrar (opcional)
        # :return: DataFrame con columnas 'year' y 'unique_athletes'
        # """
        # if countries is None:
        #     countries = ["Spain", "España", "ESP"]

        # query = f"""
        # SELECT
        #     CAST(EXTRACT(YEAR FROM competition_date) AS INTEGER) AS year,
        #     COUNT(DISTINCT fr.athlete_id) AS count
        # FROM fact_results fr
        # JOIN dim_athlete da ON fr.athlete_id = da.id
        # WHERE da.country IN ({", ".join([f"'{c}'" for c in countries])})
        # GROUP BY year
        # ORDER BY year
        # """

        # df = pd.read_sql(query, self.engine)
        # return df.to_dict(orient="records")

    # ==========================================
    # Funcion que devuelve KPI de atletas x periodo del año
    # ==========================================
    def get_unique_athletes_per_period(self) -> pd.DataFrame:
        query = text("""
            SELECT total_current, total_prev, sparkline_data 
            FROM public.kpi_dashboard_athletes 
            LIMIT 1;
        """)

        with self.engine.connect() as conn:
            result = conn.execute(query).mappings().first()

        # Si hay datos los devolvemos, si no, devolvemos un esqueleto vacío
        if result:
            return dict(result)

        return {"total_current": 0, "total_prev": 0, "sparkline_data": []}

    def get_average_for_event(self):
        # 1. Obtenemos las fechas dinámicas de "hoy" para el cálculo YTD
        today = datetime.now()
        current_year = today.year
        prev_year = current_year - 1
        current_month = today.month
        current_day = today.day

        # 2. La query SQL
        query = text("""
            WITH CompStats AS (
                -- Paso 1: Contar atletas por cada competición
                SELECT 
                    EXTRACT(YEAR FROM fr.competition_date) as comp_year,
                    fr.competition_id,
                    fr.competition_date,
                    COUNT(DISTINCT fr.athlete_id) as athlete_count
                FROM fact_results fr
                WHERE EXTRACT(YEAR FROM fr.competition_date) >= 2016
                GROUP BY fr.competition_id, fr.competition_date
            ),
            CurrentYTD AS (
                -- Paso 2A: Sacar la media del año actual (hasta el día de hoy)
                SELECT AVG(athlete_count) as avg_current
                FROM CompStats
                WHERE comp_year = :current_year
                AND (
                    EXTRACT(MONTH FROM competition_date) < :current_month
                    OR (
                        EXTRACT(MONTH FROM competition_date) = :current_month
                        AND EXTRACT(DAY FROM competition_date) <= :current_day
                    )
                )
            ),
            PrevYTD AS (
                -- Paso 2B: Sacar la media del año anterior (hasta el mismo día)
                SELECT AVG(athlete_count) as avg_prev
                FROM CompStats
                WHERE comp_year = :prev_year
                AND (
                    EXTRACT(MONTH FROM competition_date) < :current_month
                    OR (
                        EXTRACT(MONTH FROM competition_date) = :current_month
                        AND EXTRACT(DAY FROM competition_date) <= :current_day
                    )
                )
            ),
            HistoricalAverages AS (
                -- Paso 2C: Media anual de todos los años
                SELECT comp_year as year, ROUND(AVG(athlete_count), 0) as avg
                FROM CompStats
                GROUP BY comp_year
                ORDER BY comp_year ASC
            )
            -- Paso 3: Devolver ambos números YTD juntos y el array de históricos
            SELECT json_build_object(
                'current_avg', COALESCE(ROUND((SELECT avg_current FROM CurrentYTD), 0), 0),
                'prev_avg', COALESCE(ROUND((SELECT avg_prev FROM PrevYTD), 0), 0),
                'history', COALESCE((
                    SELECT json_agg(json_build_object('year', year, 'avg', avg) ORDER BY year ASC)
                    FROM HistoricalAverages
                ), '[]'::json)
            ) as result;
        """)

        # 3. Ejecutar la consulta pasando los parámetros
        try:
            with self.engine.connect() as conn:
                result = conn.execute(
                    query,
                    {
                        "current_year": current_year,
                        "prev_year": prev_year,
                        "current_month": current_month,
                        "current_day": current_day,
                    },
                ).fetchone()

                if result and result[0]:
                    data = result[0]
                    return {
                        "current_avg": int(data.get("current_avg", 0)),
                        "prev_avg": int(data.get("prev_avg", 0)),
                        "history": data.get("history", []),
                    }
                else:
                    return {"current_avg": 0, "prev_avg": 0, "history": []}

        except Exception as e:
            print(f"❌ Error al obtener el promedio de eventos: {e}")
            return {"current_avg": 0, "prev_avg": 0, "history": []}

    def get_athletes_ytd_stats(self, countries=None) -> dict:
        """
        Retorna las estadísticas YTD (Year-To-Date) de atletas únicos.
        1. Atletas en lo que va de año (ytd current).
        2. Atletas en el mismo periodo del año pasado (ytd prev).
        3. Distribución de los últimos 12 meses (rolling 12 months) para la gráfica.
        """
        if countries is None:
            countries = ["Spain", "España", "ESP"]

        countries_str = ", ".join([f"'{c}'" for c in countries])

        query = f"""
        WITH current_date_info AS (
            SELECT
                EXTRACT(YEAR FROM CURRENT_DATE) as current_year,
                EXTRACT(MONTH FROM CURRENT_DATE) as current_month,
                EXTRACT(DAY FROM CURRENT_DATE) as current_day
        ),

        ytd_data AS (
            SELECT
                EXTRACT(YEAR FROM fr.competition_date) AS comp_year,
                EXTRACT(MONTH FROM fr.competition_date) AS comp_month,
                COUNT(DISTINCT fr.athlete_id) AS monthly_unique_athletes
            FROM fact_results fr
            JOIN dim_athlete da ON fr.athlete_id = da.id
            CROSS JOIN current_date_info cdi
            WHERE da.country IN ({countries_str})
            AND EXTRACT(YEAR FROM fr.competition_date) IN (cdi.current_year, cdi.current_year - 1)
            AND (
                EXTRACT(MONTH FROM fr.competition_date) < cdi.current_month
                OR (
                    EXTRACT(MONTH FROM fr.competition_date) = cdi.current_month
                    AND EXTRACT(DAY FROM fr.competition_date) <= cdi.current_day
                )
            )
            GROUP BY 1, 2
        ),

        chart_months AS (
            SELECT
                EXTRACT(YEAR FROM fr.competition_date) AS comp_year,
                EXTRACT(MONTH FROM fr.competition_date) AS comp_month,
                COUNT(DISTINCT fr.athlete_id) AS monthly_unique_athletes
            FROM fact_results fr
            JOIN dim_athlete da ON fr.athlete_id = da.id
            CROSS JOIN current_date_info cdi
            WHERE da.country IN ({countries_str})
            AND fr.competition_date >= make_date(CAST(cdi.current_year - 1 AS INTEGER), 1, 1)
            AND fr.competition_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
            GROUP BY 1, 2
        ),

        ytd_totals AS (
            SELECT
                EXTRACT(YEAR FROM fr.competition_date) AS comp_year,
                COUNT(DISTINCT fr.athlete_id) AS ytd_unique_athletes
            FROM fact_results fr
            JOIN dim_athlete da ON fr.athlete_id = da.id
            CROSS JOIN current_date_info cdi
            WHERE da.country IN ({countries_str})
            AND EXTRACT(YEAR FROM fr.competition_date) IN (cdi.current_year, cdi.current_year - 1)
            AND (
                EXTRACT(MONTH FROM fr.competition_date) < cdi.current_month
                OR (
                    EXTRACT(MONTH FROM fr.competition_date) = cdi.current_month
                    AND EXTRACT(DAY FROM fr.competition_date) <= cdi.current_day
                )
            )
            GROUP BY 1
        )

        SELECT json_build_object(
            'ytd', (
                SELECT json_build_object(
                    'current', COALESCE(SUM(ytd_unique_athletes) FILTER (WHERE comp_year = (SELECT current_year FROM current_date_info)), 0),
                    'prev', COALESCE(SUM(ytd_unique_athletes) FILTER (WHERE comp_year = (SELECT current_year - 1 FROM current_date_info)), 0)
                )
                FROM ytd_totals
            ),
            'monthly', COALESCE(
                (SELECT json_agg(
                    json_build_object(
                        'year', comp_year,
                        'month', comp_month,
                        'count', monthly_unique_athletes
                    ) ORDER BY comp_year ASC, comp_month ASC
                )
                FROM chart_months),
                '[]'::json
            )
        ) as result;
        """

        with self.engine.connect() as conn:
            result = conn.execute(text(query)).fetchone()

        if result and result[0]:
            return result[0]
        else:
            return {"ytd": {"current": 0, "prev": 0}, "monthly": []}

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
                    fr.bodyweight AS real_bodyweight,

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
                    ON fr.athlete_id = da.id
                JOIN dim_competition dc
                    ON fr.competition_id = dc.id

                WHERE da.country IN ('Spain', 'España', 'ESP')
                AND dc.federation IN ('AEP', 'EPF', 'IPF')
                AND fr.equipment = 'Raw'
                AND fr.event_type = 'SBD'
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
                ON fr.athlete_id = da.id
            JOIN dim_competition dc
                ON fr.competition_id = dc.id
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
        SELECT DISTINCT id AS athlete_id, name
        FROM dim_athlete
        ORDER BY name ASC
        """
        df = pd.read_sql(query, self.engine)
        df = df.astype(object).where(pd.notnull(df), None)
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
                "UPDATE public.dim_athlete SET image_url = :url WHERE id = :id"
            )

            with self.engine.connect() as conn:
                conn.execute(update_query, {"url": public_url, "id": athlete_id})
                conn.commit()

            return public_url

        except Exception as e:
            print(f"❌ Error uploading profile picture: {e}")
            raise e

    def get_upcoming_competitions(self):
        """
        Retorna una lista de las próximas competiciones ordenadas por fecha.
        """
        query = """
        SELECT 
            id AS _id,
            slug,
            name,
            date,
            federation,
            country,
            state,
            town,
            status
        FROM dim_competition
        WHERE date >= CURRENT_DATE OR status = 'upcoming'
        ORDER BY date ASC NULLS LAST
        """
        df = pd.read_sql(query, self.engine)
        # Convert timestamp to string before returning if needed, but dict does it fine mostly
        df = df.astype(object).where(pd.notnull(df), None)
        return df.to_dict(orient="records")


# ------------------------------
# Ejemplo de uso

if __name__ == "__main__":
    repo = HomeRepository()
    df = repo.get_monthly_top_5_general()
    print(df)
