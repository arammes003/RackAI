import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__)))

from src.use_cases import BuildCompetitions

if __name__ == "__main__":
    try:
        print("Starting competitions build...")
        
        comp_builder = BuildCompetitions()
        comp_builder.run()
        
        print("Competitions build finished!")

    except Exception as e:
        print(f"Error: {e}")