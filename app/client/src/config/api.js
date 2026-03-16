/**
 * API Configuration
 * Uses VITE_API_URL env variable in production (Vercel),
 * falls back to localhost:8000 for local development.
 * 
 * On Vercel, set VITE_API_URL="" (empty string) so requests go to relative /api/v1/...
 */
const API_BASE = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:8000';
export const API_URL = `${API_BASE}/api/v1`;
