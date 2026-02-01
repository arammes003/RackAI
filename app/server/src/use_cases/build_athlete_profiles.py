from datetime import datetime
from src.infrastructure.database import MongoDB

class BuildAthleteProfiles:
    def __init__(self):
        self.db = MongoDB().get_database()
        self.source_collection = self.db["results"]
        self.target_collection = self.db["athletes"]

    def run(self):
        print("Building athlete profiles...")

        pipeline = [
            { "$sort": { "competition.date": 1 } },

            {
                "$group": {
                    "_id": "$athlete.id",
                    
                    "name": { "$last": "$athlete.name" },
                    "sex": { "$last": "$athlete.sex" },
                    "country": { "$last": "$athlete.country" },
                    "age": { "$last": "$athlete.age" },
                    "bodyweight": { "$last": "$athlete.bodyweight" },
                    "division": { "$last": "$category.division" },
                    "division_age": { "$last": "$category.age_class" },
                    "weight_class": { "$last": "$category.weight_class" },

                    "total_competitions": { "$sum": 1 },
                    "best_squat": { "$max": "$results.squat" },
                    "best_bench": { "$max": "$results.bench" },
                    "best_deadlift": { "$max": "$results.deadlift" },
                    "best_total": { "$max": "$results.total" },
                    "best_goodlift": { "$max": "$points.goodlift" },
                    "best_dots": { "$max": "$points.dots" },
                    "best_wilks": { "$max": "$points.wilks" },           
                    
                    "competitions_history": { "$push": "$competition.id" },
                    
                    "last_competed": { "$last": "$competition.date" }
                }
            },
            
            {
                "$project": {
                    "_id": 0,
                    "slug": "$_id",
                    "name": 1,
                    "sex": 1,
                    "age": 1,
                    "bodyweight": 1,
                    "country": 1,
                    "division": 1,
                    "division_age": 1,
                    "weight_class": 1,
                    "stats": {
                        "total_competitions": "$total_competitions",
                        "best_squat": "$best_squat",
                        "best_bench": "$best_bench",
                        "best_deadlift": "$best_deadlift",
                        "best_total": "$best_total",
                        "best_goodlift": "$best_goodlift",
                        "best_dots": "$best_dots",
                        "best_wilks": "$best_wilks"
                    },
                    "competitions": "$competitions_history",
                    "last_active": "$last_competed",
                    "updated_at": datetime.now()
                }
            },

            {
                "$out": "athletes"
            }
        ]

        self.source_collection.aggregate(pipeline)
    
        self.target_collection.create_index("slug", unique=True)
        self.target_collection.create_index("name")
        
        count = self.target_collection.count_documents({})
        print(f"Done! {count} unique profiles generated in 'athletes' collection.")