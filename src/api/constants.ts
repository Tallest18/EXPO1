export const API_BASE_URL =
  typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_BASE_URL
    ? process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, "")
    : typeof window !== "undefined" && (window as any).EXPO_PUBLIC_API_BASE_URL
      ? (window as any).EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, "")
      : "http://192.168.1.173:8000";

export const API_PREFIX = "/api";

// Temporary — remove after confirming
console.log("API_BASE_URL:", API_BASE_URL);
console.log("Full baseURL:", `${API_BASE_URL}${API_PREFIX}`);
