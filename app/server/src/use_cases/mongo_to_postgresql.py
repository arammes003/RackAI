from pymongo import MongoClient
from sqlalchemy import create_engine
import pandas as pd
import os
from dotenv import load_dotenv
from datetime import datetime
from sqlalchemy import create_engine


load_dotenv()

# =========================
# Conexiones
# =========================

mongo = MongoClient(
    f"mongodb://{os.getenv('MONGO_ROOT_USERNAME')}:{os.getenv('MONGO_ROOT_PASSWORD')}@"
    f"{os.getenv('MONGO_HOST')}:{os.getenv('MONGO_PORT')}/"
)
db = mongo["RackAI"]

DATABASE_URL = f"postgresql://postgres.uvyjzlcziqusafdjqadb:{os.getenv('POSTGRES_PASSWORD')}@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
engine = create_engine(DATABASE_URL)

federaciones_validas = {"AEP", "IPF", "EPF"}

print("Leyendo MongoDB...")

results_cursor = db.results.find()

athletes = {}
competitions = {}
facts = []

count = 0

for r in results_cursor:
    competition = r.get("competition", {})
    federation = competition.get("federation")

    if federation not in federaciones_validas:
        continue

    athlete = r.get("athlete", {})
    category = r.get("category", {})
    results = r.get("results", {})
    points = r.get("points", {})

    athlete_id = athlete.get("id")
    competition_id = competition.get("id")

    if not athlete_id or not competition_id:
        continue

    competition_date = competition.get("date")
    if isinstance(competition_date, str):
        # Corrección robusta para fechas
        try:
            competition_date = datetime.fromisoformat(
                competition_date.replace("Z", "+00:00")
            )
        except ValueError:
            competition_date = None

    # ======================
    # DIM ATHLETE
    # ======================
    # Usamos setdefault o comprobación if para no sobrescribir constantemente
    if athlete_id not in athletes:
        athletes[athlete_id] = {
            "athlete_id": athlete_id,
            "name": athlete.get("name"),
            "sex": athlete.get("sex"),
            "country": athlete.get("country"),
            "image_url": "",
        }

    # ======================
    # DIM COMPETITION
    # ======================
    if competition_id not in competitions:
        competitions[competition_id] = {
            "competition_id": competition_id,
            "name": competition.get("name"),
            "date": competition_date,
            "country": competition.get("country"),
            "state": competition.get("state"),
            "town": competition.get("town"),
            "federation": federation,
        }

    # ======================
    # LÓGICA DE LIMPIEZA (PLACE)
    # ======================
    raw_place = results.get("place")

    # Si viene texto como "DQ", "DD", "G", "NS", lo convertimos a None
    # Si es "1", "2" o un entero, lo dejamos pasar.
    if isinstance(raw_place, str) and not raw_place.isdigit():
        clean_place = None
    else:
        clean_place = raw_place

    # ======================
    # FACT RESULTS
    # ======================
    facts.append(
        {
            "athlete_id": athlete_id,
            "competition_id": competition_id,
            "competition_date": competition_date,
            "division": category.get("division"),
            "age_class": category.get("age_class"),
            "weight_class": category.get("weight_class"),
            "equipment": category.get("equipment"),
            "event": category.get("event"),
            "tested": category.get("tested"),
            "squat": results.get("squat"),
            "bench": results.get("bench"),
            "deadlift": results.get("deadlift"),
            "total": results.get("total"),
            "place": clean_place,  # <--- AQUÍ USAMOS EL DATO LIMPIO
            "dots": points.get("dots", 0.0),
            "wilks": points.get("wilks", 0.0),
            "goodlift": points.get("goodlift", 0.0),
            "glossbrenner": points.get("glossbrenner", 0.0),
        }
    )

    count += 1
    if count % 1000 == 0:
        print(f"{count} documentos procesados...")

print("Insertando en PostgreSQL...")

# Convertir a DataFrames
df_athletes = pd.DataFrame(list(athletes.values()))
df_competitions = pd.DataFrame(list(competitions.values()))
df_facts = pd.DataFrame(facts)

# Insertar dimensiones primero
df_athletes.to_sql(
    "dim_athlete", engine, if_exists="append", index=False, chunksize=1000
)
df_competitions.to_sql(
    "dim_competition", engine, if_exists="append", index=False, chunksize=1000
)

# Insertar hechos
df_facts.to_sql("fact_results", engine, if_exists="append", index=False, chunksize=1000)

print("✅ FULL LOAD COMPLETADO")
print(f"Atletas: {len(df_athletes)}")
print(f"Competiciones: {len(df_competitions)}")
print(f"Resultados: {len(df_facts)}")
