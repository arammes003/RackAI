from src.infrastructure.database import MongoDB

class BuildFederations:
    def __init__(self):
        self.db = MongoDB().get_database()
        self.results_col = self.db["results"]

    def run(self):
        print("Generating 'federations' collection...")
        
        pipeline = [
            {
                "$addFields": {
                    "year_str": { "$substr": ["$competition.date", 0, 4] } 
                }
            },
            
            {
                "$group": {
                    "_id": { 
                        "fed": "$competition.federation", 
                        "year": "$year_str" 
                    },
                    "count_for_year": { "$sum": 1 },
                    
                    "comps_in_year": { "$addToSet": "$competition.id" }
                }
            },
            
            {
                "$group": {
                    "_id": "$_id.fed",
                    "years_active": { "$push": { "$toInt": "$_id.year" } },
                    
                    "activity_array": { 
                        "$push": { 
                            "k": "$_id.year", 
                            "v": "$count_for_year" 
                        } 
                    },
                    "total_entries": { "$sum": "$count_for_year" },
                    
                    "all_comps_nested": { "$push": "$comps_in_year" }
                }
            },
            
            {
                "$project": {
                    "_id": 0,
                    "name": "$_id",
                    "slug": { "$toLower": "$_id" },
                    "first_year": { "$min": "$years_active" },
                    "last_year": { "$max": "$years_active" },
                    "total_entries": 1,
                    "activity_by_year": { "$arrayToObject": "$activity_array" },
                    
                    "competitions": {
                        "$reduce": {
                            "input": "$all_comps_nested",
                            "initialValue": [],
                            "in": { "$setUnion": ["$$value", "$$this"] }
                        }
                    }
                }
            },

            { "$out": "federations" }
        ]
        
        self.results_col.aggregate(pipeline, allowDiskUse=True)
        self.db["federations"].create_index("slug", unique=True)