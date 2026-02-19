from typing import List, Optional
from src.infrastructure.database import MongoDB
from src.domain.entities import Record


class RecordRepository:
    def __init__(self):
        self.db = MongoDB().get_database()
        self.collection = self.db["records"]

    def get_record(
        self,
        federation_slug: str,
        equipment: str,
        weight: str,
        age: str,
        sex: str = "M",
    ) -> Optional[Record]:
        """Busca un récord específico por todas sus claves."""
        query = {
            "_id.federation_slug": federation_slug.lower(),
            "_id.sex": sex,
            "_id.equipment": equipment,
            "_id.weight_class": weight,
            "_id.age_class": age,
        }
        data = self.collection.find_one(query)
        return Record.from_mongo(data) if data else None

    def get_federation_records(
        self, federation_slug: str, equipment: str
    ) -> List[Record]:
        """Devuelve la tabla completa de récords para una federación y modalidad."""
        query = {
            "_id.federation_slug": federation_slug.lower(),
            "_id.equipment": equipment,
        }
        # Ordenamos por peso y edad
        cursor = self.collection.find(query).sort(
            [("_id.weight_class", 1), ("_id.age_class", 1)]
        )
        return [Record.from_mongo(doc) for doc in cursor]
