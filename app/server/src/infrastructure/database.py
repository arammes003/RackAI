import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv

class MongoDB:
    load_dotenv()

    __instance = None
    __client = None

    def __new__(cls):
        """
            Ensures only one instance of this class exists        
        """
        if cls.__instance is None:
            cls.__instance = super(MongoDB, cls).__new__(cls)
            cls.__instance._initialize_connection()
        return cls.__instance

    def _initialize_connection(self):
        """
            Initializes the connection only if it doesn't exist yet.
        """
        try:
            user = os.getenv("MONGO_ROOT_USERNAME")
            password = os.getenv("MONGO_ROOT_PASSWORD")
            port = os.getenv("MONGO_PORT")
            host = os.getenv("MONGO_HOST")

            uri = f"mongodb://{user}:{password}@{host}:{port}/"
            
            print("Connecting to MongoDB...")
            self.__client = MongoClient(uri, serverSelectionTimeoutMS=5000)
            
            self.__client.admin.command('ping')
            print("Successfully connected to MongoDB")
            
        except ConnectionFailure:
            print("Could not connect to MongoDB Server")
            raise Exception("Database unavailable")

    def get_database(self):
        """
            Returns the database object to be used by repositories.
        """
        return self.__client["RackAI"]

    def close(self):
        """
            Closes the connection (useful for scripts or testing).
        """
        if self.__client:
            self.__client.close()
            print("MongoDB connection closed.")

# --- Test block ---
if __name__ == "__main__":
    try:
        db = MongoDB()
        database_obj = db.get_database()
        db.close()

    except Exception as e:
        print(f"Test failed: {e}")