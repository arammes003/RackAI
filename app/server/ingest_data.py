import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__)))

from src.use_cases import IngestOpenPowerlifting

if __name__ == "__main__":
    # 1. PATH TO CSV
    CSV_FILE_PATH = "E:/RackAI/data/openpowerlifting-2026-01-24.csv" 
    
    if not os.path.exists(CSV_FILE_PATH):
        print(f"ERROR: CSV file not found at: {CSV_FILE_PATH}")
        print("ℹMake sure to download it and set the correct path in ingest_data.py")
        exit()
    print("Starting ETL process...")
    
    # 2. INITIALIZE THE LOADER
    loader = IngestOpenPowerlifting(CSV_FILE_PATH)
    
    # 3. EXECUTE
    try:
        loader.run(chunk_size=10000)
    except KeyboardInterrupt:
        print("\nProcess stopped by user.")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")