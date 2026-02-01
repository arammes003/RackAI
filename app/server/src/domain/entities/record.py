from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from datetime import datetime

@dataclass
class RecordEntry:
    value: float 
    holder_name: str 
    holder_slug: str      
    date: Optional[datetime] = None
    location: Optional[str] = None

    @classmethod
    def from_dict(cls, data: dict):
        if not data:
            return None
        return cls(
            value=data.get("value", 0.0),
            holder_name=data.get("holder_name", "Unknown"),
            holder_slug=data.get("holder_slug", "unknown"),
            date=data.get("date"),
            location=data.get("location")
        )

@dataclass
class Record:

    federation_slug: str
    federation: str
    sex: str     
    equipment: str   
    weight_class: str   
    age_class: str

    squat: Optional[RecordEntry] = None
    bench: Optional[RecordEntry] = None
    deadlift: Optional[RecordEntry] = None
    total: Optional[RecordEntry] = None

    @classmethod
    def from_mongo(cls, data: dict):
        if not data:
            return None
        
        key_info = data.get("_id", {})
        
        return cls(
            federation_slug=key_info.get("federation_slug", "Unknown"),
            federation=key_info.get("federation", "Unknown"),
            sex=key_info.get("sex", "Unknown"),
            equipment=key_info.get("equipment", "Unknown"),
            weight_class=key_info.get("weight_class", "Unknown"),
            age_class=key_info.get("age_class", "Unknown"),

            squat=RecordEntry.from_dict(data.get("squat")),
            bench=RecordEntry.from_dict(data.get("bench")),
            deadlift=RecordEntry.from_dict(data.get("deadlift")),
            total=RecordEntry.from_dict(data.get("total"))
        )