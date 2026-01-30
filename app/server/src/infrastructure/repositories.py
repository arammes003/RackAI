from typing import List, Optional
from pymongo import ASCENDING, DESCENDING
from src.infrastructure.database import MongoDB
from src.domain.entities import CompetitionResult

class ResultRepository:
    def __init__(self):
        # 1. Get the unique database instance
        self.db = MongoDB().get_database()
        
        # 2. Define collection 
        self.collection = self.db["results"]

    def save(self, result: CompetitionResult):
        """
        Saves a single result. 
        Useful for tests.
        """
        data = result.to_dict()
        insert_result = self.collection.insert_one(data)
        return insert_result.inserted_id

    def save_batch(self, results: List[CompetitionResult]):
        """
        Saves a massive list of results. 
        """
        if not results:
            return

        # Convert the list of Entity objects to a list of Dictionaries (JSON)
        data_list = [r.to_dict() for r in results]
        
        # insert_many is the optimized Mongo function
        self.collection.insert_many(data_list)

    def create_indexes(self):
        """
        Creates indexes for fast searches.
        This will run once to optimize the DB.
        """

        # Index for fast search by athlete name
        self.collection.create_index([("athlete.name", ASCENDING)])
        
        # Index to sort by date (newest to oldest)
        self.collection.create_index([("competition.date", DESCENDING)])
        
        # Index by Total (critical for Rankings/Leaderboards)
        self.collection.create_index([("results.total", DESCENDING)])

        print("Indexes created in MongoDB")

    # --- Future Methods (API) ---
    
    def find_by_athlete_name(self, name: str, limit: int = 10):
        """
        Searches for results of a specific athlete.
        """
        query = {"athlete.name": {"$regex": name, "$options": "i"}} # Case-insensitive search
        cursor = self.collection.find(query).sort("competition.date", DESCENDING).limit(limit)
        return list(cursor)