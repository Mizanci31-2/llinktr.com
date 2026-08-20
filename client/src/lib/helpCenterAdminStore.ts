export type HelpCenterCategory =
  | "Ba_lang1�"
  | "Hesap"
  | "Link d�zenleme"
  | "Tema sistemi"
  | "G�venlik"
  | "Sorun giderme"
  | "Topluluk kurallar1"
  | "QR kod kullan1m1";
export type ManagedHelpArticle = {
  id: string;
  title: string;
  category: HelpCenterCategory;
  summary: string;
  steps: string[];
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
  source?: "default" | "admin";
};

export const ADMIN_HELP_ARTICLES_KEY = "llinktr.admin.helpArticles";
export const HELP_ARTICLES_EVENT = "llinktr-help-articles";

export const helpCategoryOptions: HelpCenterCategory[] = [
  "Ba_lang1�",
  "Hesap",
  "Link d�zenleme",
  "Tema sistemi",
  "G�venlik",
  "Sorun giderme",
  "Topluluk kurallar1",
  "QR kod kullan1m1",
];

function sanitizeArticle(item: unknown): ManagedHelpArticle | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const title = String(record.title || "").trim();
  const categoryValue = String(record.category || "Ba_lang1�").trim() as HelpCenterCategory;
  const category = helpCategoryOptions.includes(categoryValue) ? categoryValue : "Ba_lang1�";
  const summary = String(record.summary || "").trim();
  const steps = Array.isArray(record.steps)
    ? record.steps.map((step) => String(step || "").trim()).filter(Boolean)
    : [];
  const tags = Array.isArray(record.tags)
    ? record.tags.map((tag) => String(tag || "").trim()).filter(Boolean)
    : [];

  if (!title || !summary || steps.length === 0) return null;

  return {
    id: String(record.id || `${Date.now()}`).trim(),
    title,
    category,
    summary,
    steps,
    tags,
    createdAt: record.createdAt ? String(record.createdAt) : undefined,
    updatedAt: record.updatedAt ? String(record.updatedAt) : undefined,
    source: "admin",
  };
}

function safeParse(value: string | null): ManagedHelpArticle[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeArticle).filter(Boolean) as ManagedHelpArticle[];
  } catch {
    return [];
  }
}

export function createHelpArticleId(title: string) {
  return `${title
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/1/g, "i")
    .replace(//g, "g")
    .replace(/�/g, "u")
    .replace(/_/g, "s")
    .replace(/�/g, "o")
    .replace(/�/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)}-${Date.now()}`;
}

export function readAdminHelpArticles(): ManagedHelpArticle[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(ADMIN_HELP_ARTICLES_KEY));
}

export function writeAdminHelpArticles(articles: ManagedHelpArticle[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_HELP_ARTICLES_KEY, JSON.stringify(articles));
  window.dispatchEvent(new Event(HELP_ARTICLES_EVENT));
}

export async function fetchHelpArticles(): Promise<ManagedHelpArticle[]> {
  const response = await fetch("/api/help-articles", { credentials: "same-origin" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || "Yard1m merkezi g�nderileri al1namad1");
  const articles = safeParse(JSON.stringify(data?.articles ?? []));
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ADMIN_HELP_ARTICLES_KEY, JSON.stringify(articles));
    window.dispatchEvent(new Event(HELP_ARTICLES_EVENT));
  }
  return articles;
}

export async function saveHelpArticles(articles: ManagedHelpArticle[], adminPassword: string): Promise<ManagedHelpArticle[]> {
  const response = await fetch("/api/help-articles", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": adminPassword,
    },
    body: JSON.stringify({ articles }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || "Yard1m merkezi g�nderileri kaydedilemedi");
  const savedArticles = safeParse(JSON.stringify(data?.articles ?? []));
  writeAdminHelpArticles(savedArticles);
  return savedArticles;
}
