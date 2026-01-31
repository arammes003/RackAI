from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime

@dataclass
class AthleteStats:
    total_competitions: int
    best_total: float
    best_dots: float
    best_wilks: float
    best_goodlift: float
    
    best_squat: Optional[float] = None
    best_bench: Optional[float] = None
    best_deadlift: Optional[float] = None

@dataclass
class Athlete:
    slug: str
    name: str
    sex: str
    country: Optional[str]
    
    age: Optional[float]
    bodyweight: Optional[float]
    division: Optional[str]
    division_age: Optional[str]
    
    stats: AthleteStats
    competitions: List[str]
    
    last_active: datetime
    updated_at: datetime

    @classmethod
    def from_mongo(cls, data: dict):
        if not data:
            return None
            
        stats_data = data.get("stats", {})

        return cls(
            slug=data.get("slug"),
            name=data["name"],
            sex=data["sex"],
            country=data.get("country"),
            
            age=data.get("age"),
            bodyweight=data.get("bodyweight"),
            division=data.get("division"),
            division_age=data.get("division_age"),
            
            stats=AthleteStats(
                total_competitions=stats_data.get("total_competitions", 0),
                best_total=stats_data.get("best_total", 0.0),
                best_dots=stats_data.get("best_dots", 0.0),
                best_wilks=stats_data.get("best_wilks", 0.0),
                best_goodlift=stats_data.get("best_goodlift", 0.0),
                
                best_squat=stats_data.get("best_squat"),
                best_bench=stats_data.get("best_bench"),
                best_deadlift=stats_data.get("best_deadlift")
            ),
            
            competitions=data.get("competitions", []),
            last_active=data.get("last_active"),
            updated_at=data.get("updated_at")
        )