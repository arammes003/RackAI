from dataclasses import dataclass, field
from typing import Dict, List

@dataclass
class Federation:
    name: str
    slug: str
    first_year: int
    last_year: int
    total_entries: int
    activity_by_year: Dict[str, int]
    
    competitions: List[str] = field(default_factory=list) 

    @classmethod
    def from_mongo(cls, data: dict):
        if not data: return None
        return cls(
            name=data["name"],
            slug=data["slug"],
            first_year=data.get("first_year"),
            last_year=data.get("last_year"),
            total_entries=data.get("total_entries", 0),
            activity_by_year=data.get("activity_by_year", {}),
            competitions=data.get("competitions", []) 
        )