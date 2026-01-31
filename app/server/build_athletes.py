import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__)))

from src.use_cases import BuildAthleteProfiles

if __name__ == "__main__":
    try:
        builder = BuildAthleteProfiles()
        builder.run()

    except KeyboardInterrupt:
        print("\nProcess stopped by user.")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")