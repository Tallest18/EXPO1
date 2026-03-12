export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://cyberiah.pythonanywhere.com"
).replace(/\/$/, "");

export const API_PREFIX = "/api";
