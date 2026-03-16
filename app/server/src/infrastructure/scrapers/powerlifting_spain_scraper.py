from scrapling.fetchers import StealthyFetcher
import pdfplumber
import requests
import pandas as pd
import re
import io
import time


class PowerliftingSpainScraper:
    def __init__(self):
        self.base_url = "https://powerliftingspain.es/campeonatos-ano-2023/"

    def get_all_competition_links(self):
        page = StealthyFetcher.fetch(
            self.base_url,
            headless=True,
            network_idle=True,
        )

        # Extraer los enlaces de las cajas de imagen de Elementor
        links = page.css(".elementor-image-box-wrapper a::attr(href)").getall()

        # Limpiamos duplicados
        return list(set(links))

    def scrape_competition_detail(self, url):
        page = StealthyFetcher.fetch(url, headless=True, network_idle=True)

        # --- Título ---
        titulo = (
            page.css("h1.entry-title::text").get()
            or page.css(".elementor-heading-title::text").get()
            or ""
        )

        # --- Extraer poster de las cajas Elementor Image Box ---
        poster_url = None
        image_boxes = page.css(".elementor-image-box-wrapper")

        for box in image_boxes:
            caption = box.css(".elementor-image-box-title a::text").get("")
            link = box.css(".elementor-image-box-title a::attr(href)").get("")

            if not caption:
                caption = box.css(".elementor-image-box-title::text").get("")

            caption_lower = caption.strip().lower()

            if "cartel" in caption_lower:
                poster_url = link

        # --- PDFs / documentos ---
        all_pdf_links = [
            a.attrib.get("href", "")
            for a in page.css('a[href$=".pdf"]')
            if a.attrib.get("href")
        ]
        # Eliminar duplicados manteniendo orden
        seen = set()
        documentos = []
        for link in all_pdf_links:
            if link not in seen:
                seen.add(link)
                documentos.append(link)

        # Filtrar solo los PDFs de clasificaciones
        clasificaciones = [d for d in documentos if "clasificaci" in d.lower()]

        return {
            "url": url,
            "titulo": titulo.strip(),
            "poster_url": poster_url,
            "documentos": documentos,
            "clasificaciones": clasificaciones,
        }

    def get_all_clasificacion_links(self):
        """
        Scrapea todas las competiciones y devuelve una lista de URLs
        de PDFs de clasificaciones.
        """
        comp_links = self.get_all_competition_links()
        all_clasificaciones = []

        for link in comp_links:
            print(f"  📄 Scrapeando: {link}")
            try:
                data = self.scrape_competition_detail(link)
                for clf_url in data["clasificaciones"]:
                    all_clasificaciones.append(
                        {
                            "competition_url": link,
                            "competition_name": data["titulo"],
                            "pdf_url": clf_url,
                        }
                    )
                time.sleep(1)  # Pausa entre peticiones
            except Exception as e:
                print(f"  ❌ Error: {e}")

        return all_clasificaciones

    @staticmethod
    def _safe_float(val: str) -> float | None:
        """Convierte un valor a float, devolviendo None para 'X' o valores inválidos."""
        if not val or val.strip().upper() == "X":
            return None
        return float(val.replace(",", "."))

    def parse_clasificacion_pdf(self, pdf_url: str) -> pd.DataFrame:
        """
        Descarga y parsea un PDF de clasificaciones de PowerliftingSpain.

        Soporta dos formatos:
        - Con Pt (internacional): POS NOMBRE AÑO CLUB PESO COEF ORD SQ1-3 RANK BP1-3 RANK DL1-3 RANK TOTAL IPFGL PT
        - Sin Pt (nacional):      POS NOMBRE AÑO CLUB PESO COEF ORD SQ1-3 RANK BP1-3 RANK DL1-3 RANK TOTAL IPFGL

        Maneja: decimales con coma, clubs de 2-8 letras, intentos X (nulos),
        atletas DSQ (línea empieza con —), categorías de peso (-53kg, -66kg).

        Returns:
            DataFrame con los resultados normalizados.
        """
        print(f"  📥 Descargando PDF: {pdf_url}")
        response = requests.get(pdf_url, timeout=30)
        response.raise_for_status()
        pdf_bytes = io.BytesIO(response.content)

        rows = []
        current_category = ""
        current_gender = ""

        # Valor numérico (acepta coma o punto como decimal)
        NUM = r"[\d]+[.,]?\d*"
        # Valor que puede ser número o X (intento nulo)
        ATTEMPT = r"(?:[\d]+[.,]?\d*|X)"

        # Regex principal: POS NOMBRE AÑO CLUB PESO COEF ORD SQ1 SQ2 SQ3 RANK BP1 BP2 BP3 RANK DL1 DL2 DL3 RANK TOTAL IPFGL [PT]
        result_line_pattern = re.compile(
            r"^(\d{1,3})\s+"  # 1: Posición
            r"(.+?)\s+"  # 2: Nombre
            r"(\d{4})\s+"  # 3: Año nacimiento
            r"([A-Za-z]{2,8})\s+"  # 4: Club (2-8 letras)
            r"(" + NUM + r")\s+"  # 5: Peso corporal
            r"(" + NUM + r")\s+"  # 6: Coeficiente
            r"(\d+)\s+"  # 7: Orden
            r"(" + ATTEMPT + r")\s+"  # 8: SQ1
            r"(" + ATTEMPT + r")\s+"  # 9: SQ2
            r"(" + ATTEMPT + r")\s+"  # 10: SQ3
            r"(\d+)\s+"  # 11: SQ Rank
            r"(" + ATTEMPT + r")\s+"  # 12: BP1
            r"(" + ATTEMPT + r")\s+"  # 13: BP2
            r"(" + ATTEMPT + r")\s+"  # 14: BP3
            r"(\d+)\s+"  # 15: BP Rank
            r"(" + ATTEMPT + r")\s+"  # 16: DL1
            r"(" + ATTEMPT + r")\s+"  # 17: DL2
            r"(" + ATTEMPT + r")\s+"  # 18: DL3
            r"(\d+)\s+"  # 19: DL Rank
            r"(" + NUM + r")\s+"  # 20: Total
            r"(" + NUM + r")"  # 21: IPFGL
            r"(?:\s+(\d+))?"  # 22: Pt (opcional)
        )

        # Categorías de peso: -53kg, -66kg, +120kg, etc.
        weight_class_pattern = re.compile(r"^[-+]?\d+\s*kg$", re.IGNORECASE)

        # Categorías de género/disciplina
        gender_pattern = re.compile(
            r"^(HOMBRES|MUJERES|MEN|WOMEN)\s+(.*)",
            re.IGNORECASE,
        )
        discipline_pattern = re.compile(
            r"^(HOMBRES|MUJERES|MEN|WOMEN|SUB[ -]?\d+|JUNIOR|SENIOR|MASTER|OPEN|"
            r"EQUIPADO|RAW|CLASSIC|ABSOLUT[OA]|PRESS\s+BANCA|"
            r"MASCULINO|FEMENINO)",
            re.IGNORECASE,
        )

        with pdfplumber.open(pdf_bytes) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if not text:
                    continue

                for line in text.split("\n"):
                    line = line.strip()
                    if not line:
                        continue

                    # Saltar líneas de encabezado, paginación, etc.
                    if line.startswith("LEVANTADOR") or line.startswith("Página"):
                        continue
                    if line.startswith("ASOCIACIÓN") or line.startswith("EUROPEAN"):
                        continue
                    if line.startswith("Rev.") or line.startswith("Campeonato"):
                        continue
                    if line.startswith("AEP-") or line.startswith("CLASIFICACIÓN"):
                        continue

                    # Saltar líneas de DSQ (empiezan con —)
                    if line.startswith("—") or line.startswith("–"):
                        continue

                    # Detectar categoría de género+disciplina
                    gender_match = gender_pattern.match(line)
                    if gender_match:
                        current_gender = line.strip()
                        continue

                    # Detectar categoría de peso
                    if weight_class_pattern.match(line):
                        current_category = line.strip()
                        continue

                    # Detectar otras líneas de categoría/disciplina
                    if discipline_pattern.match(line) and not re.match(r"^\d", line):
                        current_gender = line.strip()
                        continue

                    # Detectar línea de resultado
                    match = result_line_pattern.match(line)
                    if match:
                        g = match.groups()
                        rows.append(
                            {
                                "posicion": int(g[0]),
                                "nombre": g[1].strip(),
                                "anio_nacimiento": int(g[2]),
                                "club": g[3],
                                "peso_corporal": self._safe_float(g[4]),
                                "coeficiente": self._safe_float(g[5]),
                                "orden": int(g[6]),
                                "sq1": self._safe_float(g[7]),
                                "sq2": self._safe_float(g[8]),
                                "sq3": self._safe_float(g[9]),
                                "sq_rank": int(g[10]),
                                "bp1": self._safe_float(g[11]),
                                "bp2": self._safe_float(g[12]),
                                "bp3": self._safe_float(g[13]),
                                "bp_rank": int(g[14]),
                                "dl1": self._safe_float(g[15]),
                                "dl2": self._safe_float(g[16]),
                                "dl3": self._safe_float(g[17]),
                                "dl_rank": int(g[18]),
                                "total": self._safe_float(g[19]),
                                "ipf_gl": self._safe_float(g[20]),
                                "puntos": int(g[21]) if g[21] else None,
                                "genero_disciplina": current_gender,
                                "categoria_peso": current_category,
                                "pdf_url": pdf_url,
                            }
                        )

        df = pd.DataFrame(rows)
        return df
