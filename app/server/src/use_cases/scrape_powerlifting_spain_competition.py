from src.infrastructure.scrapers.powerlifting_spain_scraper import (
    PowerliftingSpainScraper,
)
from src.infrastructure.repositories.competition_repository import CompetitionRepository

import json


class IngestPowerliftingSpainUseCase:
    def __init__(self):
        self.scraper = PowerliftingSpainScraper()

    def execute(self):
        print("Iniciando búsqueda de competiciones...")
        comp_links = self.scraper.get_all_competition_links()

        for link in comp_links:
            print(f"Scrapeando: {link}")
            data = self.scraper.scrape_competition_detail(link)

            print(json.dumps(data, indent=2))
