from src.infrastructure.database import MongoDB

class BuildRecords:
    def __init__(self):
        self.db = MongoDB().get_database()
        self.results_col = self.db["results"]

    def run(self):
        print("Starting records build...")
        
        self.db["records"].drop()
        
        self._build_lift_record("squat")
        self._build_lift_record("bench")
        self._build_lift_record("deadlift")
        self._build_lift_record("total")
        
        print("Records build finished!")

    def _build_lift_record(self, lift_type: str):
        print(f"Searching records of: {lift_type.upper()}...")
        
        target_field = f"results.{lift_type}"
        
        output_field = lift_type 

        pipeline = [
            {
                "$match": {
                    target_field: { "$gt": 0, "$ne": None },
                    "place": { "$ne": "DQ" },
                    "athlete.sex": { "$exists": True },
                    "category.equipment": { "$exists": True },
                    "category.weight_class": { "$exists": True } 
                }
            },
            { "$sort": { target_field: -1 } },
            {
                "$group": {
                    "_id": {
                        "federation_slug": { "$toLower": "$competition.federation" },
                        "sex": "$athlete.sex",
                        "equipment": "$category.equipment",
                        "weight_class": "$category.weight_class",
                        "age_class": "$category.age_class"
                    },
                    "federation_name": { "$first": "$competition.federation" },
                    "val": { "$first": f"${target_field}" },
                    "holder": { "$first": "$athlete.name" },
                    "slug": { "$first": "$athlete.id" },
                    "date": { "$first": "$competition.date" },
                    "loc": { "$first": "$competition.country" }
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "federation": "$federation_name",
                    output_field: {
                        "value": "$val",
                        "holder_name": "$holder",
                        "holder_slug": "$slug",
                        "date": "$date",
                        "location": "$loc"
                    }
                }
            },
            {
                "$merge": {
                    "into": "records",
                    "on": "_id",
                    "whenMatched": "merge",
                    "whenNotMatched": "insert"
                }
            }
        ]
        
        self.results_col.aggregate(pipeline, allowDiskUse=True)