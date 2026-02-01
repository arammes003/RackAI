from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class CompetitionResult:
    """
        Represents a result in a specific competition.
    """

    # Identifiers
    athlete_name: str
    athlete_slug: str
    competition_slug: str
    
    # Context
    meet_name: str
    origin_federation: str
    competition_date: datetime
    meet_country: str
    meet_state: Optional[str]
    meet_town: Optional[str]
    
    # Athlete
    sex: str
    birth_year_class: Optional[str]
    age: Optional[float]
    bodyweight: Optional[float]
    country: Optional[str]

    # Category
    division: str
    age_class: str
    weight_class: str
    equipment: str
    event_type: str
    tested: bool

    # Performance
    best_squat: Optional[float] 
    best_bench: Optional[float] 
    best_deadlift: Optional[float] 
    total: Optional[float]
    place: str 

    # Points
    dots: Optional[float] = 0.0
    wilks: Optional[float] = 0.0
    glossbrenner: Optional[float] = 0.0
    goodlift: Optional[float] = 0.0

    def to_dict(self):
        """
            Prepares the object for saving in Mongo
        """
        return {
            "athlete": {
                "id": self.athlete_slug,
                "name": self.athlete_name,
                "sex": self.sex,
                "age": self.age,
                "country": self.country,
                "bodyweight": self.bodyweight
            },
            "competition": {
                "id": self.competition_slug,
                "name": self.meet_name,
                "date": self.competition_date,
                "country": self.meet_country,
                "town": self.meet_town,
                "federation": self.origin_federation
            },
            "category": {
                "division": self.division,
                "age_class": self.age_class,
                "weight_class": self.weight_class,
                "equipment": self.equipment,
                "event": self.event_type,
                "tested": self.tested
            },
            "results": {
                "squat": self.best_squat,
                "bench": self.best_bench,
                "deadlift": self.best_deadlift,
                "total": self.total,
                "place": self.place
            },
            "points": {
                "dots": self.dots,
                "wilks": self.wilks,
                "goodlift": self.goodlift
            }
        }