export const DEFAULT_CANVA_PROFILE_URL =
  import.meta.env.VITE_CANVA_PROFILE_URL || "https://www.canva.com/";

export function isVideoMediaUrl(value?: string | null) {
  if (!value) return false;
  if (value.startsWith("data:video/")) return true;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(value);
}

export function formatCompactUrl(value?: string | null) {
  if (!value) return "https://...";
  return value
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .slice(0, 42);
}
