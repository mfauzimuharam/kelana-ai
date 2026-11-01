// Backend base URL — set NEXT_PUBLIC_API_URL in .env.local (dev) or on Vercel (production).
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export const API_V1 = `${API_URL}/api/v1`;

// sessionStorage key used to highlight a freshly generated trip on the dashboard.
export const NEW_TRIP_KEY = "jalan_jalan_new_trip";
