/**
 * API Configuration
 * Uses VITE_API_URL env variable in production (Vercel),
 * falls back to localhost:8000 for local development.
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_URL = `${API_BASE}/api/v1`;
