export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://cyberiah.pythonanywhere.com"
).replace(/\/$/, "");

export const API_PREFIX = "/api";

// Temporary — remove after confirming
console.log("API_BASE_URL:", API_BASE_URL);
console.log("Full baseURL:", `${API_BASE_URL}${API_PREFIX}`);
