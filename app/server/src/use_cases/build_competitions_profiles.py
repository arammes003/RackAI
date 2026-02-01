from src.infrastructure.database import MongoDB

class BuildCompetitions:
    def __init__(self):
        self.db = MongoDB().get_database()
        self.results_col = self.db["results"]

    def run(self):
        print("Generating 'competitions' collection...")
        pipeline = [
            {
                "$group": {
                    "_id": "$competition.id",
                    "name": { "$first": "$competition.name" },
                    "date": { "$first": "$competition.date" },
                    "country": { "$first": "$competition.country" },
                    "town": { "$first": "$competition.town" },
                    "federation": { "$first": "$competition.federation" },
                    "total_athletes": { "$sum": 1 } 
                }
            },

            {
                "$project": {
                    "_id": 0,
                    "slug": "$_id",
                    "name": 1, 
                    "date": 1, 
                    "country": 1, 
                    "town": 1, 
                    "federation": 1,
                    "federation_slug": { "$toLower": "$federation" }, 
                    "total_athletes": 1
                }
            },
            { "$out": "competitions" }
        ]
        self.results_col.aggregate(pipeline)
        
        self.db["competitions"].create_index("date")
        self.db["competitions"].create_index("federation_slug") 
        
        print("Competitions collection generated successfully.")