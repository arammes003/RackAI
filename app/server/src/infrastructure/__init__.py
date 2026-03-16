import os

# Only import MongoDB/scrapers when NOT on Vercel
# (pymongo is not available in Vercel's serverless environment)
if os.environ.get("VERCEL") != "1":
    from .repositories import ResultRepository
    from .database import MongoDB
    from .scrapers import UpcomingCompetitionScraper
