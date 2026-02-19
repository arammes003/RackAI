from typing import List
from src.infrastructure.scrapers.upcoming_scraper import UpcomingCompetitionScraper
from src.infrastructure.repositories.competition_repository import CompetitionRepository
from src.domain.entities import Competition


class IngestUpcomingCompetitions:
    def __init__(self, csv_path: str = "E:/RackAI/data/Calendario_AEP_2026.csv"):
        self.scraper = UpcomingCompetitionScraper(csv_path)
        self.repository = CompetitionRepository()

    def execute(self) -> List[Competition]:
        # 1. Scrape data
        print("Starting scraping process...")
        competitions = self.scraper.scrape()

        if not competitions:
            print("No competitions found or parsed.")
            return []

        print(f"Scraped {len(competitions)} competitions.")

        saved_count = 0
        for comp in competitions:
            self.repository.collection.update_one(
                {"slug": comp.slug}, {"$set": comp.__dict__}, upsert=True
            )
            saved_count += 1

        print(f"Successfully saved/upserted {saved_count} competitions.")
        return competitions
