from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class Competition:
    slug: str
    name: str
    date: datetime
    country: Optional[str]
    town: Optional[str]
    federation: str
    federation_slug: str
    total_athletes: int

    @classmethod
    def from_mongo(cls, data: dict):
        if not data: return None
        return cls(
            slug=data["slug"],
            name=data["name"],
            date=data["date"],
            country=data.get("country"),
            town=data.get("town"),
            federation=data.get("federation"),
            federation_slug=data.get("federation_slug"),
            total_athletes=data.get("total_athletes", 0)
        )