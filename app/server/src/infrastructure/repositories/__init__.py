import os

# Only import all repositories when NOT on Vercel
# DashboardAnalytics and others depend on pymongo which is not in Vercel's requirements
if os.environ.get("VERCEL") != "1":
    from .result_repository import ResultRepository
    from .athlete_repository import AthleteRepository
    from .competition_repository import CompetitionRepository
    from .records_repository import RecordRepository
    from .federation_repository import FederationRepository
    from .dashboard_analytics import DashboardAnalytics
    from .home_repository import HomeRepository
