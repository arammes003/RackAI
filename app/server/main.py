import src.infrastructure.repositories.home_repository as home_repository
import uvicorn
from fastapi import FastAPI, Query, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from src.infrastructure.repositories.dashboard_analytics import DashboardAnalytics
import easyocr
from rapidfuzz import fuzz
import numpy as np
import cv2

app = FastAPI()

# Allow CORS for client development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# analytics = DashboardAnalytics()


# @app.get("/analytics/upcoming")
# def upcoming_competitions(limit: int = 5):
#     """Returns upcoming competitions."""
#     return analytics.get_upcoming_competitions(limit)


# @app.post("/ingest/upcoming")
# def ingest_upcoming():
#     """Triggers the scraping of upcoming competitions from local CSV."""
#     try:
#         competitions = analytics.ingest_upcoming_competitions()
#         return {
#             "status": "success",
#             "count": len(competitions),
#             "data": competitions,
#             "message": "Upcoming competitions ingested successfully",
#         }
#     except Exception as e:
#         return {"status": "error", "message": str(e)}


"""
    UPLOAD PHOTO
"""


def preprocess_image_smart(image_bytes):
    # Convertir bytes a imagen OpenCV
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # A. Redimensionar si es gigante (Mejora velocidad y precisión)
    # Las fotos de móvil modernas son enormes (3000px+). EasyOCR prefiere ~1000px.
    height, width = img.shape[:2]
    if width > 1200:
        scale = 1200 / width
        dim = (1200, int(height * scale))
        img = cv2.resize(img, dim, interpolation=cv2.INTER_AREA)

    # B. Solo Escala de Grises (Sin binarizar agresivamente)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # (Opcional) Un poco de desenfoque suave para quitar el ruido del granulado ISO
    # gray = cv2.GaussianBlur(gray, (3, 3), 0)

    # Devolver bytes
    is_success, buffer = cv2.imencode(".jpg", gray)
    return buffer.tobytes()


# --- 3. LIMPIEZA DE TEXTO (Leet Speak) ---
def clean_ocr_text(text):
    text = text.upper()
    # Mapa extendido de errores comunes
    replacements = {
        "0": "O",
        "1": "I",
        "2": "Z",
        "3": "E",
        "4": "A",
        "5": "S",
        "6": "G",
        "8": "B",
        "9": "S",
        "@": "A",
        "€": "E",
        "$": "S",
        "|": "I",
        "(": " ",
        ")": " ",
        "[": "I",
        "]": "I",
        "{": "I",
        "}": "I",  # <--- NUEVOS
        "-": " ",
        "_": " ",
        "/": " ",
    }
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    return text


@app.post("/api/verify-id")
async def verify_identity(
    dni_image: UploadFile = File(...), athlete_name: str = Form(...)
):
    reader = easyocr.Reader(["es"], gpu=True)  # Pon True si tienes GPU NVIDIA
    print(f"🕵️‍♂️ Verificando a: {athlete_name}")

    try:
        # A. Leer imagen original
        image_bytes = await dni_image.read()

        # B. Pre-procesado SUAVE (Gris + Resize)
        processed_bytes = preprocess_image_smart(image_bytes)

        # C. OCR: Leer texto
        # detail=0 devuelve lista de strings. paragraph=False lee línea a línea.
        result_list = reader.readtext(processed_bytes, detail=0)

        # Unimos todo el texto encontrado
        full_text_raw = " ".join(result_list)

        # D. Limpieza de caracteres
        full_text_clean = clean_ocr_text(full_text_raw)

        # Log para que veas qué está leyendo realmente ahora
        print(f"📝 Texto Leído: {full_text_clean[:100]}...")

        # E. Coincidencia (Divide y Vencerás)
        # Limpiamos también el nombre que nos llega del formulario
        target_name_clean = clean_ocr_text(athlete_name)
        target_parts = target_name_clean.split()

        matches = 0
        details = []

        for part in target_parts:
            # Filtro: Ignorar palabras muy cortas (ej: "DE", "LA") si quieres
            if len(part) < 2:
                continue

            # Buscamos la palabra en el texto completo
            score = fuzz.partial_token_set_ratio(part, full_text_clean)
            details.append(f"{part}: {int(score)}%")

            # Umbral 80%
            if score > 80:
                matches += 1

        # F. Veredicto
        # Permitimos 1 fallo si el nombre es largo (3+ palabras)
        required_matches = len(target_parts)
        if len(target_parts) >= 3:
            required_matches -= 1

        is_verified = matches >= required_matches

        return {
            "verified": is_verified,
            "score": matches * 100 / len(target_parts)
            if target_parts
            else 0,  # Aproximado
            "msg": "Identidad confirmada" if is_verified else "Nombre no encontrado",
            "details": details,
            "raw_text": full_text_clean[:60],  # Para debug
        }

    except Exception as e:
        print(f"❌ Error crítico: {e}")
        return {"verified": False, "msg": "Error en servidor"}


@app.post("/api/upload-profile-picture")
async def upload_profile_picture(
    athlete_id: str = Form(...), file: UploadFile = File(...)
):
    try:
        print(
            f"📸 Recibiendo subida de foto. ID: {athlete_id}, Archivo: {file.filename}"
        )

        if not file:
            return {"status": "error", "message": "No file uploaded"}

        file_bytes = await file.read()
        repo = home_repository.HomeRepository()

        # Obtener extensión del archivo original
        file_name = file.filename
        content_type = file.content_type

        public_url = repo.upload_profile_picture(
            athlete_id, file_bytes, file_name, content_type
        )

        return {
            "status": "success",
            "image_url": public_url,
            "message": "Profile picture uploaded successfully",
        }
    except Exception as e:
        print(f"❌ Error in upload endpoint: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/api/athletes")
def get_all_athletes():
    """Devuelve listado de todos los atletas para el buscador."""
    repo = home_repository.HomeRepository()
    return repo.get_all_athletes()


"""
    HOME ENDPOINTS
"""


@app.get("/analytics/athletes-per-year")
def athletes_per_year():
    """Returns summar cards for Home."""
    repo = home_repository.HomeRepository()
    return repo.get_unique_athletes_per_year()


@app.get("/analytics/competitions-per-year")
def competitions_per_year():
    """Returns summar cards for Home."""
    repo = home_repository.HomeRepository()
    return repo.get_competitions_per_year()


@app.get("/analytics/historical-leaderboard")
def historical_leaderboard(
    sex: str = Query("M"),
    limit: int = Query(10),
):
    """
    Devuelve el Ranking Histórico Absoluto (All-Time) de España.
    Muestra el mejor levantamiento de cada atleta.
    """
    repo = home_repository.HomeRepository()
    return repo.get_historical_leaderboard(sex, limit=limit)


@app.get("/analytics/monthly-top5-general")
def monthly_top5_general():
    """
    Devuelve el Top 5 mensual de cada disciplina (Squat, Bench, Deadlift, Total, GL)
    para hombres y mujeres en España.
    """
    repo = home_repository.HomeRepository()
    return repo.get_monthly_top_5_general()


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
