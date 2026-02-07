from typing import List, Optional
from pymongo import DESCENDING
from src.infrastructure.database import MongoDB
from src.domain.entities import Athlete

class AthleteRepository:
    def __init__(self):
        self.db = MongoDB().get_database()
        self.collection = self.db["athletes"]

    def find_by_slug(self, slug: str) -> Optional[Athlete]:
        """Busca un atleta por su ID único."""
        data = self.collection.find_one({"slug": slug})
        if data:
            return Athlete.from_mongo(data)
        return None

    def search_by_name(self, query: str, limit: int = 5) -> List[Athlete]:
        """Buscador parcial por nombre."""
        regex_query = {"name": {"$regex": query, "$options": "i"}}
        cursor = self.collection.find(regex_query)\
            .sort("stats.total_competitions", DESCENDING)\
            .limit(limit)
        
        return [Athlete.from_mongo(doc) for doc in cursor]
        
    def find_many_by_slugs(self, slugs: List[str]) -> List[Athlete]:
        """Busca varios atletas por su lista de IDs."""
        cursor = self.collection.find({"slug": { "$in": slugs }})
        return [Athlete.from_mongo(doc) for doc in cursor]