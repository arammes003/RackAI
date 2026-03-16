import sys
import os
from datetime import (
    date,
    datetime,
)  # NUEVO: Importamos para manejar las fechas actuales

# Esto añade la carpeta 'server' al path de Python
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from typing import List
from dotenv import load_dotenv
from supabase import create_client, Client
from src.infrastructure.scrapers.upcoming_scraper import UpcomingCompetitionScraper
from src.domain.entities import Competition


class IngestUpcomingCompetitions:
    def __init__(self, csv_path: str = "E:/RackAI/data/Calendario_AEP_2026.csv"):
        self.scraper = UpcomingCompetitionScraper(csv_path)

        load_dotenv()
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        self.supabase: Client = create_client(url, key)

    def execute(self) -> List[Competition]:
        print("Starting scraping process...")
        competitions = self.scraper.scrape()

        if not competitions:
            print("No competitions found or parsed.")
            return []

        print(f"Scraped {len(competitions)} competitions.")

        saved_count_supabase = 0

        # NUEVO: Obtenemos la fecha exacta del día en que se ejecuta el script
        today = date.today()

        for comp in competitions:
            try:
                date_str = comp.date.isoformat() if comp.date else None

                # ==========================================
                # LÓGICA DINÁMICA DE ESTADO (STATUS)
                # ==========================================
                calculated_status = "upcoming"  # Por defecto

                if comp.date:
                    # Nos aseguramos de extraer solo la parte de la fecha (YYYY-MM-DD) para evitar conflictos de Timezones
                    comp_date_only = (
                        comp.date.date()
                        if isinstance(comp.date, datetime)
                        else comp.date
                    )

                    if comp_date_only < today:
                        calculated_status = "completed"
                # Si comp.date es None, lo dejamos como 'upcoming' asumiendo que es un evento por definir.

                supabase_data = {
                    "slug": comp.slug,
                    "name": comp.name,
                    "date": date_str,
                    "country": comp.country,
                    "town": comp.town,
                    "federation": comp.federation,
                    "status": calculated_status,  # APLICAMOS EL ESTADO CALCULADO
                }

                self.supabase.table("dim_competition").upsert(
                    supabase_data, on_conflict="slug"
                ).execute()

                saved_count_supabase += 1
            except Exception as e:
                print(f"Error inserting competition {comp.slug} into Supabase: {e}")

        print(
            f"✅ Successfully saved/upserted {saved_count_supabase} competitions to Supabase."
        )
        return competitions


# ==========================================
# LANZADOR DEL SCRAPER (Entry Point)
# ==========================================
if __name__ == "__main__":
    print("🚀 Iniciando el Ingestor de Competiciones Futuras (RackAI)...")

    try:
        ingestor = IngestUpcomingCompetitions()
        competitions_saved = ingestor.execute()

        print(
            f"🏁 Proceso finalizado exitosamente. Total procesado: {len(competitions_saved)}"
        )
        sys.exit(0)

    except Exception as e:
        print(f"❌ Error crítico durante la ejecución del scraper: {e}")
        sys.exit(1)
