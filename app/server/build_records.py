import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__)))

from src.use_cases.build_records_profiles import BuildRecords

if __name__ == "__main__":
    try:

        builder = BuildRecords()
        builder.run()

    except KeyboardInterrupt:
        print("\nProcess stopped by user.")
    except Exception as e:
        print(f"\nUnexpected error: {e}")