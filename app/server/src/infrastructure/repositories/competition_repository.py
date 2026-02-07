from typing import List, Optional
from pymongo import DESCENDING
from src.infrastructure.database import MongoDB
from src.domain.entities import Competition

class CompetitionRepository:
    def __init__(self):
        self.db = MongoDB().get_database()
        self.collection = self.db["competitions"]

    def find_by_slug(self, slug: str) -> Optional[Competition]:
        data = self.collection.find_one({"slug": slug})
        return Competition.from_mongo(data) if data else None

    def list_recent(self, limit: int = 10) -> List[Competition]:
        """Devuelve las últimas competiciones añadidas o celebradas."""
        cursor = self.collection.find().sort("date", DESCENDING).limit(limit)
        return [Competition.from_mongo(doc) for doc in cursor]