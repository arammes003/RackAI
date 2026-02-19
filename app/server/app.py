import time
from pymongo import MongoClient
from sqlalchemy import create_engine
import pandas as pd
from dotenv import load_dotenv
import os

load_dotenv()

# --- MongoDB ---
mongo = MongoClient(
    f"mongodb://{os.getenv('MONGO_ROOT_USERNAME')}:{os.getenv('MONGO_ROOT_PASSWORD')}@"
    f"{os.getenv('MONGO_HOST')}:{os.getenv('MONGO_PORT')}/"
)
db = mongo["RackAI"]

start_mongo = time.time()
pipeline = [
    {
        "$match": {
            "athlete.country": {"$in": ["Spain", "España", "ESP"]},
            "category.tested": True,
            "competition.date": {"$ne": None},
        }
    },
    {
        "$group": {
            "_id": {"$year": "$competition.date"},
            "unique_ids": {"$addToSet": "$athlete.id"},
        }
    },
    {"$project": {"_id": 0, "year": "$_id", "count": {"$size": "$unique_ids"}}},
    {"$sort": {"year": 1}},
]
mongo_result = list(db.results.aggregate(pipeline))
end_mongo = time.time()

print("MongoDB:", end_mongo - start_mongo, "segundos")

# --- PostgreSQL ---
engine = create_engine(os.getenv("POSTGRES_URL"))

start_pg = time.time()
query = """
SELECT
    CAST(EXTRACT(YEAR FROM competition_date) AS INTEGER) AS year,
    COUNT(DISTINCT fr.athlete_id) AS unique_athletes
FROM fact_results fr
JOIN dim_athlete da ON fr.athlete_id = da.athlete_id
WHERE da.country IN ('Spain', 'España', 'ESP')
GROUP BY year
ORDER BY year;
"""
pg_result = pd.read_sql(query, engine)
end_pg = time.time()

print("PostgreSQL:", end_pg - start_pg, "segundos")
