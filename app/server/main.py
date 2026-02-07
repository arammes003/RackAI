import uvicorn
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from src.infrastructure.repositories.dashboard_analytics import DashboardAnalytics

app = FastAPI()

# Allow CORS for client development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analytics = DashboardAnalytics()

@app.get("/")
def read_root():
    return {"status": "RackAI API is running"}

@app.get("/analytics/market-trends")
def market_trends():
    """Returns growth of federations over time."""
    return analytics.get_market_trends()

@app.get("/analytics/equipment-trends")
def equipment_trends():
    """Returns popularity of Raw vs Equipped."""
    return analytics.get_equipment_trends()

@app.get("/analytics/benchmarks")
def benchmarks(sex: str = "M", equipment: str = "Raw", weight_class: str = "93"):
    """Returns strength standards (Average vs Elite)."""
    return analytics.get_strength_benchmarks(sex, equipment, weight_class)

@app.get("/analytics/peak-age")
def peak_age(sex: str = "M", equipment: str = "Raw"):
    """Returns age vs strength curve."""
    return analytics.get_peak_age_curve(sex, equipment)

@app.get("/analytics/geo-hotspots")
def geo_hotspots():
    """Returns top countries by athlete count."""
    return analytics.get_geo_hotspots()

@app.get("/analytics/aep-growth")
def aep_growth():
    """Specific for Spanish Federation growth."""
    return analytics.get_aep_growth()

@app.get("/analytics/lift-ratios")
def lift_ratios(sex: str = "M", equipment: str = "Raw"):
    """Returns avg % of Total for Squat/Bench/Deadlift."""
    return analytics.get_lift_ratios(sex, equipment)

@app.get("/analytics/fed-performance")
def fed_performance():
    """Returns avg DOTS by Federation."""
    return analytics.get_federation_performance_index()

@app.get("/analytics/home-stats")
def home_stats():
    """Returns summar cards for Home."""
    return analytics.get_home_stats()

@app.get("/analytics/weight-efficiency")
def weight_efficiency(sex: str = "M", equipment: str = "Raw"):
    """Returns scatter data for Bodyweight vs DOTS."""
    return analytics.get_weight_efficiency_scatter(sex, equipment)

@app.get("/analytics/rankings")
def rankings(federation: str = "ALL", limit: int = 10, tested: str = "TESTED"):
    """
    Returns top rankings filtered by federation.
    tested: 'TESTED', 'UNTESTED', 'ALL'
    """
    return analytics.get_specific_rankings(federation, limit, tested)

@app.get("/analytics/country-champions")
def country_champions(sex: str = "M", equipment: str = "Raw", tested: bool = True):
    """Returns best athletes per country."""
    return analytics.get_country_champions(sex, equipment, tested)

@app.get("/analytics/country-top10")
def get_country_top10(
    sex: str = Query("M"),
    equipment: str = Query("Raw"),
    tested: str = Query("TESTED")
):
    """Obtiene el Top 10 de atletas por cada país."""
    return analytics.get_top10_by_country(sex, equipment, tested)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
