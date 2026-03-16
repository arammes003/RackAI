from src.domain.entities.athlete import AthleteStats
from src.domain.entities import Athlete
import os
import pandas as pd
from typing import List, Optional
from sqlalchemy import create_engine, NullPool
from supabase import create_client, Client
from dotenv import load_dotenv


class AthleteRepository:
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

    def get_all_athletes(self) -> List[Athlete]:
        """Retorna una lista de todos los atletas (id y nombre) ordenados alfabéticamente."""
        query = "SELECT athlete_id AS slug, name, sex, country FROM dim_athlete ORDER BY name ASC"
        df = pd.read_sql(query, self.engine)
        df = df.astype(object).where(pd.notnull(df), None)

        athletes = []
        for doc in df.to_dict(orient="records"):
            stats = AthleteStats(
                total_competitions=0,
                best_total=0.0,
                best_dots=0.0,
                best_wilks=0.0,
                best_goodlift=0.0,
            )

            athlete = Athlete(
                slug=doc.get("slug"),
                name=doc.get("name"),
                sex=doc.get("sex", "M"),
                country=doc.get("country"),
                age=None,
                bodyweight=None,
                division=None,
                division_age=None,
                weight_class=None,
                stats=stats,
                competitions=[],
                last_active=None,
                updated_at=None,
            )
            athletes.append(athlete)

        return athletes

    def get_athletes_with_prs(self):
        """Retorna los atletas con sus PRs para la página de Atletas."""
        query = """
            WITH ranked AS (
                SELECT
                    da.id AS athlete_id,
                    da.name,
                    da.sex,
                    da.country,
                    da.image_url AS image,
                    fr.squat AS sq,
                    fr.bench AS bp,
                    fr.deadlift AS dl,
                    fr.total,
                    fr.goodlift AS gl,
                    fr.weight_class,
                    ROW_NUMBER() OVER (
                        PARTITION BY da.id 
                        ORDER BY fr.total DESC NULLS LAST, fr.competition_date DESC NULLS LAST
                    ) as rn
                FROM dim_athlete da
                LEFT JOIN fact_results fr 
                    ON da.id = fr.athlete_id 
                    AND fr.equipment = 'Raw' 
                    AND fr.event_type = 'SBD' 
                    AND fr.tested = TRUE
                WHERE da.country IN ('Spain', 'España', 'ESP')
                   OR EXISTS (
                       SELECT 1 
                       FROM fact_results fr2
                       JOIN dim_competition dc ON fr2.competition_id = dc.id
                       WHERE fr2.athlete_id = da.id
                         AND dc.federation = 'AEP'
                   )
            )

            SELECT 
                athlete_id, 
                athlete_id AS id, 
                name, 
                sex, 
                country, 
                image, 
                sq, 
                bp, 
                dl, 
                total, 
                gl, 
                weight_class
            FROM ranked 
            WHERE rn = 1 
            ORDER BY name ASC
        """
        df = pd.read_sql(query, self.engine)
        df = df.astype(object).where(pd.notnull(df), None)
        return df.to_dict(orient="records")
