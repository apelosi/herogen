// Since .env files are hidden in some editors, place your public configuration here.
// You can get your Client ID from: https://console.cloud.google.com/apis/credentials
export const CONFIG = {
  // Neon Auth (Better Auth) base URL
  NEON_AUTH_URL: import.meta.env.VITE_NEON_AUTH_URL || "",
  // Neon Data API base URL (PostgREST)
  NEON_DATA_API_URL: import.meta.env.VITE_NEON_DATA_API_URL || "",
};