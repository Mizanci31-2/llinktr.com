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

export function readHomeAdminSettings(): HomeAdminSettings {
  if (typeof window === "undefined") return defaultHomeAdminSettings;
  try {
    const raw = window.localStorage.getItem(HOME_ADMIN_SETTINGS_KEY);
    if (!raw) return defaultHomeAdminSettings;
    return { ...defaultHomeAdminSettings, ...JSON.parse(raw) };
  } catch {
    return defaultHomeAdminSettings;
  }
}
