"""
Vercel Serverless Function entry point.
Re-exports the FastAPI app from main.py for Vercel's Python runtime.

NOTE: The OCR/verify-id endpoint is disabled in Vercel because
easyocr + torch + opencv exceed the 250MB serverless function limit.
"""
import sys
import os

# Add the server directory to the Python path so imports work
server_dir = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, server_dir)

# Set VERCEL env flag so main.py can conditionally skip heavy imports
os.environ["VERCEL"] = "1"

from main import app
