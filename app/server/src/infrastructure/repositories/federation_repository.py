from typing import List, Optional
from pymongo import ASCENDING
from src.infrastructure.database import MongoDB
from src.domain.entities import Federation

class FederationRepository:
    def __init__(self):
        self.db = MongoDB().get_database()
        self.collection = self.db["federations"]

    def find_by_slug(self, slug: str) -> Optional[Federation]:
        data = self.collection.find_one({"slug": slug})
        return Federation.from_mongo(data) if data else None

    def list_all(self) -> List[Federation]:
        """Listado de todas las federaciones."""
        cursor = self.collection.find().sort("name", ASCENDING)
        return [Federation.from_mongo(doc) for doc in cursor]