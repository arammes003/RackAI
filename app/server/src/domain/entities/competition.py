from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Competition:
    # --- Identificadores (Claves Naturales) ---
    slug: str
    name: str
    federation: str
    # poster_url: str

    # --- Atributos Temporales y de Estado ---
    # CRÍTICO: Debe ser Optional porque hay competiciones históricas sin fecha exacta
    date: Optional[datetime] = None
    # NUEVO: Controla si la competición ya ocurrió ('completed') o es futura ('upcoming')
    status: str = "completed"

    # --- Ubicación (Alineado con esquema Postgres) ---
    country: Optional[str] = None
    state: Optional[str] = (
        None  # AÑADIDO: Hacemos match con la columna 'state' de Postgres
    )
    town: Optional[str] = None

    # --- Metadatos extra (Usados en Mongo/Frontend pero no en Postgres) ---
    federation_slug: str = ""
    total_athletes: int = 0

    @classmethod
    def from_mongo(cls, data: dict):
        if not data:
            return None
        return cls(
            slug=data.get("slug"),
            name=data.get("name"),
            federation=data.get("federation"),
            # poster_url=data.get("poster_url"),
            date=data.get("date"),
            status=data.get("status", "completed"),
            country=data.get("country"),
            state=data.get("state"),
            town=data.get("town"),
            federation_slug=data.get("federation_slug", ""),
            total_athletes=data.get("total_athletes", 0),
        )
