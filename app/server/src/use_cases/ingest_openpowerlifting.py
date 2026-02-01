import pandas as pd
import numpy as np
import re
from datetime import datetime
from typing import Optional

from src.domain.entities import CompetitionResult
from src.infrastructure.repositories import ResultRepository

class IngestOpenPowerlifting:
    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.repository = ResultRepository()
        
    def _safe_float(self, value) -> Optional[float]:
        """
        Converts dirty CSV values to Float or None.
        Handles empty values (NaN) and strange text formats.
        """
        try:
            if pd.isna(value) or value == "":
                return None
            return float(value)
        except (ValueError, TypeError):
            return None

    def _parse_date(self, date_str) -> datetime:
        """
        Attempts to convert the date string. If it fails, returns a default date.
        """
        try:
            # Standard OpenPL format: YYYY-MM-DD
            return datetime.strptime(str(date_str), "%Y-%m-%d")
        except:
            # If the date is broken, set a very old default date
            return datetime(1900, 1, 1)

    def _generate_slug(self, text: str) -> str:
        """
        Generates a readable ID (slug) from a text string.
        Ex: "Jesus Olivares" -> "jesus-olivares"
        """
        if not text or pd.isna(text):
            return "unknown"
        
        # 1. Convert to string and lowercase
        slug = str(text).lower()
        
        # 2. Replace non-alphanumeric characters with hyphens
        # (Removes accents, spaces, parentheses, etc.)
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        
        # 3. Strip leading/trailing hyphens
        return slug.strip('-')

    def _process_row(self, row) -> CompetitionResult:
        """
        Transforms a raw Pandas row (Series) into our clean Entity.
        """
        
        # 'Tested' logic: If "Yes" -> True, otherwise -> False
        is_tested = str(row.get('Tested', '')).lower() == 'yes'

        # --- SLUG (ID) GENERATION ---
        # 1. Athlete ID
        slug_atleta = self._generate_slug(row['Name'])

        # 2. Competition ID
        # Combine Name + Year + Country to avoid duplicates (e.g., multiple "Nationals")
        year = str(row['Date'])[:4] # Extract just the year "2019"
        raw_comp_name = f"{row['MeetName']} {year} {row.get('MeetCountry', '')}"
        slug_compe = self._generate_slug(raw_comp_name)

        return CompetitionResult(
            # --- Identification (NEW FIELDS) ---
            athlete_slug=slug_atleta,
            competition_slug=slug_compe,

            # --- Original Identification ---
            athlete_name=str(row['Name']),
            sex=str(row['Sex']),
            birth_year_class=str(row.get('BirthYearClass', '')),
            age=self._safe_float(row.get('Age')),
            bodyweight=self._safe_float(row.get('BodyweightKg')),
            country=str(row.get('Country', '')),

            # --- Context ---
            origin_federation=str(row['Federation']),
            competition_date=self._parse_date(row['Date']),
            meet_name=str(row['MeetName']),
            meet_country=str(row['MeetCountry']),
            meet_state=str(row.get('MeetState', '')),
            meet_town=str(row.get('MeetTown', '')),

            # --- Category ---
            division=str(row.get('Division', '')),
            age_class=str(row.get('AgeClass', '')),
            weight_class=str(row.get('WeightClassKg', '')),
            equipment=str(row['Equipment']),
            event_type=str(row['Event']),
            tested=is_tested,

            # --- Results ---
            best_squat=self._safe_float(row.get('Best3SquatKg')),
            best_bench=self._safe_float(row.get('Best3BenchKg')),
            best_deadlift=self._safe_float(row.get('Best3DeadliftKg')),
            total=self._safe_float(row.get('TotalKg')),
            
            place=str(row.get('Place', 'DQ')), 

            # --- Points ---
            dots=self._safe_float(row.get('Dots')),
            wilks=self._safe_float(row.get('Wilks')),
            glossbrenner=self._safe_float(row.get('Glossbrenner')),
            goodlift=self._safe_float(row.get('Goodlift'))
        )

    def run(self, chunk_size=10000):
        """
        Executes the ETL process in batches.
        """
        print(f"🚀 Starting bulk load from: {self.csv_path}")
        print(f"📦 Batch size: {chunk_size} rows")
        
        total_inserted = 0
        batch_num = 0

        # Read CSV in chunks to avoid memory overflow
        with pd.read_csv(self.csv_path, chunksize=chunk_size, low_memory=False) as reader:
            for chunk in reader:
                batch_num += 1
                clean_entities = []
                
                # Iterate over rows in the current chunk
                for _, row in chunk.iterrows():
                    try:
                        entity = self._process_row(row)
                        clean_entities.append(entity)
                    except Exception as e:
                        # If a row is severely broken, skip it but log warning
                        # print(f"⚠️ Error in row: {e}") # Uncomment for deep debugging
                        continue
                
                # Save batch to MongoDB
                if clean_entities:
                    self.repository.save_batch(clean_entities)
                    total_inserted += len(clean_entities)
                    print(f"✅ Batch {batch_num} processed. Total accumulated: {total_inserted}")

        print("🏁 ETL Finished successfully!")