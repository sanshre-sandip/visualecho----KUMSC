export const API_BASE_URL = (
  import.meta.env.EXPO_PUBLIC_API_BASE_URL ??
  "https://visualecho-kumsc.vercel.app"
).replace(/\/+$/, "");
