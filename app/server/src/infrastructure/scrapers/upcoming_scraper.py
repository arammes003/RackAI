import pandas as pd
import re
from datetime import datetime
from typing import List, Optional
from src.domain.entities import Competition


class UpcomingCompetitionScraper:
    def __init__(self, csv_path: str = "E:/RackAI/data/Calendario_AEP_2026.csv"):
        self.csv_path = csv_path
        self.months_map = {
            "ene": 1,
            "feb": 2,
            "mar": 3,
            "abr": 4,
            "may": 5,
            "jun": 6,
            "jul": 7,
            "ago": 8,
            "sep": 9,
            "oct": 10,
            "nov": 11,
            "dic": 12,
            "sept": 9,  # Variacion
        }

    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """
        Parses dates like '17-ene', '24-25 ene', '28-01 feb-mar'.
        Assumes year 2026.
        Returns the start date.
        """
        if not isinstance(date_str, str) or not date_str.strip():
            return None

        # Clean string
        date_str = date_str.lower().strip()

        # Simple case: "17-ene"
        # Complex case: "24-25 ene" (Take 24)
        # Complex case: "28-01 feb-mar" (Take 28 feb)

        try:
            # Extract the first number part
            parts = re.split(r"[- ]", date_str)
            day_part = parts[0]
            if not day_part.isdigit():
                return None  # "pendiente" or "sin confirmar"

            day = int(day_part)

            # Find month
            month = None
            for part in parts:
                if part in self.months_map:
                    month = self.months_map[part]
                    break

            # If month not found in first parts, look ahead in the string?
            # "28-01 feb-mar" -> parts might be ['28', '01', 'feb', 'mar']
            # If we find a month, we assume it applies to the LAST number if ambiguous,
            # but usually for "24-25 ene", 'ene' applies to both.
            # For "28-01 feb-mar", it's 28-feb to 01-mar.
            # Let's try to map the first number to the first identified month OR
            # if multiple months, map to the first one?
            # Actually, "28-01 feb-mar" usually implies 28th of Feb.

            if not month:
                # Search in the whole string again carefully
                for m_str, m_int in self.months_map.items():
                    if m_str in date_str:
                        month = m_int
                        break

            if not month:
                # Default or error
                return None

            return datetime(2026, month, day)
        except Exception:
            return None

    def _clean_text(self, text) -> str:
        if pd.isna(text) or text == "":
            return ""
        return str(text).strip().replace("\n", " ").replace("\r", "")

    def _generate_slug(self, name: str) -> str:
        name_slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
        return name_slug

    def scrape(self) -> List[Competition]:
        competitions = []

        try:
            # Read CSV with header on line 0 (1-indexed 1)
            # Adjust if needed. The file provided has "FECHA" in line 1.
            df = pd.read_csv(self.csv_path, header=0, encoding="utf-8")
            # Note: The file content view showed header at line 1.

            # Identify columns by name or index to be safe
            # Expected: FECHA, COMPETICIONES..., LOCALIDAD, ORGANIZADOR, NIVEL, DIVISIONES...

            for _, row in df.iterrows():
                fecha_raw = row.get("FECHA")
                comp_name = row.get(
                    "COMPETICIONES 1º TRIMESTRE 2026"
                )  # This col name might change in pandas if it's the first one found
                # Actually, check the columns printed in probe or view_file
                # Col 1: FECHA
                # Col 2: COMPETICIONES 1º TRIMESTRE 2026 (Title of col is dynamic? No, usually first row is header)
                # But CSV has section headers throughout.

                # Check if it's a valid row
                if (
                    pd.isna(fecha_raw)
                    or str(fecha_raw).startswith("COMPETICIONES")
                    or str(fecha_raw).startswith("SIN")
                ):
                    continue

                # Parse date
                date_obj = self._parse_date(fecha_raw)
                if not date_obj:
                    # Skip "pendiente" or invalid dates for now, or handle differently?
                    # User requirement: "proximas competiciones". Pendiente ones are technically upcoming but have no date.
                    # We can store them with a far future date or null if allowed.
                    # Entity `Competition` expects `date: datetime`.
                    # Let's clean parse only valid dates for now.
                    continue

                # Parse Name
                name = self._clean_text(comp_name)
                # If name is "AEP 3...", etc.

                # Parse Location
                town = self._clean_text(row.get("LOCALIDAD"))
                organizer = self._clean_text(row.get("ORGANIZADOR"))
                nivel = self._clean_text(row.get("NIVEL"))

                # Federation Logic
                # "AEP1", "AEP2", "AEP3" -> AEP
                # "EPF" -> EPF
                # "IPF" -> IPF
                federation = "AEP"  # Default
                if "EPF" in nivel:
                    federation = "EPF"
                elif "IPF" in nivel:
                    federation = "IPF"
                elif "AEP" in nivel:
                    federation = "AEP"
                else:
                    federation = "AEP"  # Fallback

                federation_slug = federation.lower()

                # Slug
                slug = self._generate_slug(name)

                comp = Competition(
                    slug=slug,
                    name=name,
                    date=date_obj,
                    country="Spain"
                    if "ESPAÑA" in organizer or "Spain" not in town
                    else town,  # Simple logic, improve if needed
                    town=town,
                    federation=federation,
                    federation_slug=federation_slug,
                    total_athletes=0,  # Flag for upcoming
                )
                competitions.append(comp)

        except Exception as e:
            print(f"Error scraping local CSV: {e}")
            raise e

        return competitions
