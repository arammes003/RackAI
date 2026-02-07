from typing import List
from pymongo import ASCENDING, DESCENDING
from src.infrastructure.database import MongoDB
from src.domain.entities import CompetitionResult

class ResultRepository:
    def __init__(self):
        self.db = MongoDB().get_database()
        self.collection = self.db["results"]

    def save_batch(self, results: List[CompetitionResult]):
        """Guarda una lista masiva de resultados."""
        if not results:
            return
        data_list = [r.to_dict() for r in results]
        self.collection.insert_many(data_list)

    def create_indexes(self):
        """Optimiza la base de datos creando índices."""
        self.collection.create_index([("athlete.id", ASCENDING)])
        self.collection.create_index([("competition.id", ASCENDING)])
        self.collection.create_index([("athlete.name", ASCENDING)])
        self.collection.create_index([("results.total", DESCENDING)])

        """
           ------ DASHBOARDS ------                
        """

        # 1. Ranking Global de España (Cuando Federación = ALL)
        self.collection.create_index([
            ("athlete.country", ASCENDING),   # Primero filtramos España
            ("category.tested", ASCENDING),   # Luego si es Tested
            ("points.goodlift", DESCENDING)   # Finalmente ordenamos por puntos
        ], name="idx_country_rankings_global")

        # 2. Ranking de España por Federación (Cuando eliges AEP, EPF, etc.)
        self.collection.create_index([
            ("athlete.country", ASCENDING),
            ("competition.federation", ASCENDING), # Aquí añadimos la fed
            ("category.tested", ASCENDING),
            ("points.goodlift", DESCENDING)
        ], name="idx_country_rankings_specific_federation")

        self.collection.create_index([
            ("competition.federation", ASCENDING),
            ("category.tested", ASCENDING),
            ("points.goodlift", DESCENDING)
        ], name="idx_rankings_goodlift")


        # 1. Ranking por País
        self.collection.create_index([
            ("athlete.sex", ASCENDING),
            ("category.equipment", ASCENDING),
            ("category.tested", ASCENDING),
            ("results.total", DESCENDING)
        ], name="idx_country_champions")

        print("✅ Índices de Resultados creados en MongoDB")

    def get_by_competition(self, competition_slug: str) -> List[CompetitionResult]:
        """Devuelve la 'Leaderboard' de una competición."""
        query = {"competition.id": competition_slug}
        cursor = self.collection.find(query).sort("results.total", DESCENDING)
        return [self._map_to_entity(doc) for doc in cursor]

    def get_by_athlete(self, athlete_slug: str) -> List[CompetitionResult]:
        """Devuelve el historial completo de un atleta."""
        query = {"athlete.id": athlete_slug}
        cursor = self.collection.find(query).sort("competition.date", DESCENDING)
        return [self._map_to_entity(doc) for doc in cursor]

    def get_history_by_slugs(self, slugs: List[str]) -> List[CompetitionResult]:
        """
        Trae el historial completo de una lista de atletas.
        """
        query = {
            "athlete.id": { "$in": slugs },
            "results.total": { "$gt": 0 } # Ignoramos nulos
        }
        # Ordenamos por fecha para que la gráfica salga bien
        cursor = self.collection.find(query).sort("competition.date", 1)
        return [self._map_to_entity(doc) for doc in cursor]

    def _map_to_entity(self, data: dict) -> CompetitionResult:
        """Helper para convertir JSON de Mongo a Entidad."""
        return CompetitionResult(
            athlete_slug=data["athlete"]["id"],
            competition_slug=data["competition"]["id"],
            athlete_name=data["athlete"]["name"],
            sex=data["athlete"]["sex"],
            birth_year_class=data["athlete"].get("birth_year_class"),
            age=data["athlete"].get("age"),
            bodyweight=data["athlete"].get("bodyweight"),
            country=data["athlete"].get("country"),
            origin_federation=data["competition"]["federation"],
            competition_date=data["competition"]["date"],
            meet_name=data["competition"]["name"],
            meet_country=data["competition"]["country"],
            meet_state=data["competition"].get("state"),
            meet_town=data["competition"].get("town"),
            division=data["category"]["division"],
            age_class=data["category"]["age_class"],
            weight_class=data["category"].get("weight_class", ""),
            equipment=data["category"]["equipment"],
            event_type=data["category"]["event"],
            tested=data["category"]["tested"],
            best_squat=data["results"]["squat"],
            best_bench=data["results"]["bench"],
            best_deadlift=data["results"]["deadlift"],
            total=data["results"]["total"],
            place=data["results"]["place"],
            dots=data["points"].get("dots"),
            wilks=data["points"].get("wilks"),
            glossbrenner=data["points"].get("glossbrenner"),
            goodlift=data["points"].get("goodlift")
        )