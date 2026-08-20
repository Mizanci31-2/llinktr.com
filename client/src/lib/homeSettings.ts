export type HomeAdminSettings = {
  heroTitle: string;
  heroSubtitle: string;
  heroProof: string;
  heroImage: string;
};

export const HOME_ADMIN_SETTINGS_KEY = "llinktr.homeSettings";

export const defaultHomeAdminSettings: HomeAdminSettings = {
  heroTitle: "Tüm linklerini tek sayfada topla",
  heroSubtitle: "Takipçini müşteriye çevir. Bio sayfanı saniyeler içinde oluştur.",
  heroProof: "+150 kullanıcı • 250+ link • büyüyor",
  heroImage: "/images/hero-preview-1.png",
};

export function normalizeHomeAdminSettings(value: Partial<HomeAdminSettings> | null | undefined): HomeAdminSettings {
  return {
    heroTitle: value?.heroTitle || defaultHomeAdminSettings.heroTitle,
    heroSubtitle: value?.heroSubtitle || defaultHomeAdminSettings.heroSubtitle,
    heroProof: value?.heroProof || defaultHomeAdminSettings.heroProof,
    heroImage: value?.heroImage || defaultHomeAdminSettings.heroImage,
  };
}

export function readHomeAdminSettings(): HomeAdminSettings {
  if (typeof window === "undefined") return defaultHomeAdminSettings;
  try {
    const raw = window.localStorage.getItem(HOME_ADMIN_SETTINGS_KEY);
    if (!raw) return defaultHomeAdminSettings;
    return normalizeHomeAdminSettings(JSON.parse(raw));
  } catch {
    return defaultHomeAdminSettings;
  }
}

export async function fetchHomeAdminSettings(): Promise<HomeAdminSettings> {
  const response = await fetch("/api/home-settings", { credentials: "same-origin" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || "Ana sayfa ayarları alınamadı");
  return normalizeHomeAdminSettings(data?.settings);
}

export async function saveHomeAdminSettings(settings: HomeAdminSettings, adminPassword: string): Promise<HomeAdminSettings> {
  const response = await fetch("/api/home-settings", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": adminPassword,
    },
    body: JSON.stringify({ settings }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || "Ana sayfa ayarları kaydedilemedi");
  return normalizeHomeAdminSettings(data?.settings);
}
