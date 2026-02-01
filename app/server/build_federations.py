import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__)))

from src.use_cases import BuildFederations

if __name__ == "__main__":
    try:
        print("Starting federations build...")
        
        fed_builder = BuildFederations()
        fed_builder.run()
        
        print("Federations build finished!")

    except Exception as e:
        print(f"Error: {e}")