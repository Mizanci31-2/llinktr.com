import { blogPosts } from "@/lib/marketingContent";

export type BlogSection = [string, string];

export type ManagedBlogPost = {
  slug: string;
  title: string;
  description: string;
  intro: string;
  sections: BlogSection[];
  createdAt?: string;
  updatedAt?: string;
  source?: "default" | "admin";
};

export const ADMIN_BLOG_POSTS_KEY = "llinktr.admin.blogPosts";
export const BLOG_POSTS_EVENT = "llinktr-blog-posts";

function safeParse(value: string | null): ManagedBlogPost[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        slug: String(item.slug || "").trim(),
        title: String(item.title || "").trim(),
        description: String(item.description || "").trim(),
        intro: String(item.intro || "").trim(),
        sections: Array.isArray(item.sections)
          ? item.sections
              .filter((section: unknown) => Array.isArray(section) && section.length >= 2)
              .map((section: unknown[]) => [String(section[0] || ""), String(section[1] || "")] as BlogSection)
          : [],
        createdAt: item.createdAt ? String(item.createdAt) : undefined,
        updatedAt: item.updatedAt ? String(item.updatedAt) : undefined,
        source: "admin" as const,
      }))
      .filter((item) => item.slug && item.title && item.description);
  } catch {
    return [];
  }
}

export function slugifyBlogTitle(value: string) {
  return value
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
    .slice(0, 90);
}

export function readAdminBlogPosts(): ManagedBlogPost[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(ADMIN_BLOG_POSTS_KEY));
}

export function writeAdminBlogPosts(posts: ManagedBlogPost[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_BLOG_POSTS_KEY, JSON.stringify(posts));
  window.dispatchEvent(new Event(BLOG_POSTS_EVENT));
}

export function getDefaultBlogPosts(): ManagedBlogPost[] {
  return blogPosts.map((post) => ({
    ...post,
    sections: post.sections.map((section) => [section[0], section[1]] as BlogSection),
    source: "default" as const,
  }));
}

export function getAllBlogPosts() {
  const defaults = getDefaultBlogPosts();
  const defaultSlugs = new Set(defaults.map((post) => post.slug));
  const custom = readAdminBlogPosts().filter((post) => !defaultSlugs.has(post.slug));
  return [...custom, ...defaults];
}
