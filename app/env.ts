// For client-side, we need NEXT_PUBLIC_ prefix
export const API_HOST = process.env.NEXT_PUBLIC_HOST || process.env.HOST || "http://localhost:8000"
