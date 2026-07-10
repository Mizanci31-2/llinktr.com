import { useEffect } from "react";
import { useLocation } from "wouter";
import { blogPosts, landingPages } from "@/lib/marketingContent";

const SITE_URL = "https://llinktr.com";
const DEFAULT_TITLE = "Llinktr - �cretsiz Toplu Link ve Bio Link Sayfas1 Olu_tur";
const DEFAULT_DESCRIPTION =
  "Llinktr ile Instagram, TikTok, YouTube, WhatsApp ve web site linklerinizi tek bio sayfas1nda �cretsiz toplay1n. H1zl1, sade, �zelle_tirilebilir toplu link platformu.";
const DEFAULT_KEYWORDS =
  "toplu link sayfas1, �cretsiz toplu link, bio link olu_turucu, linktree alternatifi, dijital link alternatifi, link in bio, �cretsiz link in bio, sosyal medya link sayfas1, Instagram bio link, TikTok bio link, YouTube link sayfas1, tek link ile t�m balant1lar, llinktr";
const DEFAULT_IMAGE = `${SITE_URL}/site-logo.png`;

type SeoConfig = {
  title: string;
  description: string;
  canonicalPath: string;
  keywords?: string;
  robots?: string;
  breadcrumb: string;
};

const publicSeo: Record<string, SeoConfig> = {
  "/": {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    canonicalPath: "/",
    keywords: DEFAULT_KEYWORDS,
    breadcrumb: "Ana Sayfa",
  },
  "/login": {
    title: "Giri_ Yap | Llinktr",
    description: "Llinktr hesab1n1za giri_ yap1n. Bio link sayfalar1n1z1, k1sa linklerinizi ve QR kodlar1n1z1 tek panelden y�netin.",
    canonicalPath: "/login",
    breadcrumb: "Giri_ Yap",
  },
  "/giris": {
    title: "Giri_ Yap | Llinktr",
    description: "Llinktr hesab1n1za giri_ yap1n. Bio link sayfalar1n1z1, k1sa linklerinizi ve QR kodlar1n1z1 tek panelden y�netin.",
    canonicalPath: "/login",
    breadcrumb: "Giri_ Yap",
  },
  "/kayit": {
    title: "�cretsiz Kay1t Ol | Llinktr",
    description: "�cretsiz Llinktr hesab1 olu_turun, bio link sayfan1z1 haz1rlay1n ve t�m sosyal medya balant1lar1n1z1 tek linkte payla_1n.",
    canonicalPath: "/kayit",
    breadcrumb: "�cretsiz Kay1t Ol",
  },
  "/register": {
    title: "�cretsiz Kay1t Ol | Llinktr",
    description: "�cretsiz Llinktr hesab1 olu_turun, bio link sayfan1z1 haz1rlay1n ve t�m sosyal medya balant1lar1n1z1 tek linkte payla_1n.",
    canonicalPath: "/kayit",
    breadcrumb: "�cretsiz Kay1t Ol",
  },
  "/hakkimizda": {
    title: "Hakk1m1zda | Llinktr",
    description: "Llinktr; i�erik �reticileri, i_letmeler ve freelancerlar i�in modern, h1zl1 ve �cretsiz bio link sayfas1 olu_turma platformudur.",
    canonicalPath: "/hakkimizda",
    breadcrumb: "Hakk1m1zda",
  },
  "/blog": {
    title: "Blog | Llinktr",
    description: "Bio link, sosyal medya link y�netimi, Linktree alternatifleri, QR kod ve �cretsiz link sayfas1 rehberleri.",
    canonicalPath: "/blog",
    breadcrumb: "Blog",
  },
  "/topluluk-kurallari": {
    title: "Topluluk Kurallar1 | Llinktr",
    description: "Llinktr kullan1c1lar1 i�in g�venli balant1, spam, yeti_kin i�erik ve k�t�ye kullan1m kurallar1.",
    canonicalPath: "/topluluk-kurallari",
    breadcrumb: "Topluluk Kurallar1",
  },
  "/yardim-merkezi": {
    title: "Yard1m Merkezi | Llinktr",
    description: "Bio link sayfas1, k1sa link, QR kod, hesap ayarlar1 ve g�venlik bildirimleri i�in Llinktr yard1m merkezi.",
    canonicalPath: "/yardim-merkezi",
    breadcrumb: "Yard1m Merkezi",
  },
  "/report": {
    title: "0�erik Raporla | Llinktr",
    description: "Spam, zararl1 balant1, yan1lt1c1 profil veya politika ihlali bildirmek i�in Llinktr raporlama sayfas1.",
    canonicalPath: "/report",
    breadcrumb: "0�erik Raporla",
  },
  "/bio-duzenleyici": {
    title: "Bio D�zenleyici | Llinktr",
    description: "Llinktr Bio D�zenleyici ile sosyal medya, maaza, WhatsApp ve ileti_im linklerinizi tek mobil uyumlu sayfada d�zenleyin.",
    canonicalPath: "/bio-duzenleyici",
    breadcrumb: "Bio D�zenleyici",
  },
  "/link-kisaltici": {
    title: "Link K1salt1c1 | Llinktr",
    description: "Llinktr Link K1salt1c1 ile uzun balant1lar1n1z1 k1sa, payla_1labilir ve takip edilebilir linklere d�n�_t�r�n.",
    canonicalPath: "/link-kisaltici",
    breadcrumb: "Link K1salt1c1",
  },
  "/qr-olusturucu": {
    title: "QR Olu_turucu | Llinktr",
    description: "Llinktr QR Olu_turucu ile link, WhatsApp, e-posta ve metinler i�in h1zl1, modern ve payla_1labilir QR kodlar olu_turun.",
    canonicalPath: "/qr-olusturucu",
    breadcrumb: "QR Olu_turucu",
  },
  "/404": {
    title: "Sayfa Bulunamad1 | Llinktr",
    description: "Arad11n1z sayfa ta_1nm1_, silinmi_ veya hi� var olmam1_ olabilir.",
    canonicalPath: "/404",
    robots: "noindex,follow",
    breadcrumb: "Sayfa Bulunamad1",
  },
};

function getSeoConfig(pathname: string): SeoConfig {
  const staticConfig = publicSeo[pathname];
  if (staticConfig) return staticConfig;

  const landing = Object.values(landingPages).find((page) => page.path === pathname);
  if (landing) {
    return {
      title: `${landing.title} | Llinktr`,
      description: landing.description,
      canonicalPath: landing.path,
      breadcrumb: landing.title,
    };
  }

  if (pathname.startsWith("/blog/")) {
    const slug = pathname.replace("/blog/", "");
    const post = blogPosts.find((item) => item.slug === slug);
    if (post) {
      return {
        title: `${post.title} | Llinktr Blog`,
        description: post.description,
        canonicalPath: `/blog/${post.slug}`,
        breadcrumb: post.title,
      };
    }
  }

  if (/^\/(dashboard|panel|builder|admin|admin31|settings|account|api|go|r)(\/|$)/.test(pathname)) {
    return {
      title: "Llinktr Panel",
      description: "Llinktr kullan1c1 paneli.",
      canonicalPath: pathname,
      robots: "noindex,nofollow",
      breadcrumb: "Panel",
    };
  }

  return publicSeo["/"];
}

function setMeta(selector: string, create: () => HTMLMetaElement, content: string) {
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.content = content;
}

function setJsonLd(id: string, data: unknown) {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export function SeoManager() {
  const [location] = useLocation();

  useEffect(() => {
    const pathname = location.split("?")[0] || "/";
    const config = getSeoConfig(pathname);
    const canonicalUrl = `${SITE_URL}${config.canonicalPath === "/" ? "/" : config.canonicalPath}`;
    const title = config.title;
    const description = config.description;

    document.title = title;

    setMeta("meta[name='description']", () => {
      const meta = document.createElement("meta");
      meta.name = "description";
      return meta;
    }, description);

    setMeta("meta[name='keywords']", () => {
      const meta = document.createElement("meta");
      meta.name = "keywords";
      return meta;
    }, config.keywords || DEFAULT_KEYWORDS);

    setMeta("meta[name='robots']", () => {
      const meta = document.createElement("meta");
      meta.name = "robots";
      return meta;
    }, config.robots || "index,follow");

    setMeta("meta[property='og:title']", () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:title");
      return meta;
    }, title);

    setMeta("meta[property='og:description']", () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:description");
      return meta;
    }, description);

    setMeta("meta[property='og:url']", () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:url");
      return meta;
    }, canonicalUrl);

    setMeta("meta[property='og:image']", () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:image");
      return meta;
    }, DEFAULT_IMAGE);

    setMeta("meta[name='twitter:card']", () => {
      const meta = document.createElement("meta");
      meta.name = "twitter:card";
      return meta;
    }, "summary_large_image");

    setMeta("meta[name='twitter:title']", () => {
      const meta = document.createElement("meta");
      meta.name = "twitter:title";
      return meta;
    }, title);

    setMeta("meta[name='twitter:description']", () => {
      const meta = document.createElement("meta");
      meta.name = "twitter:description";
      return meta;
    }, description);

    setMeta("meta[name='twitter:image']", () => {
      const meta = document.createElement("meta");
      meta.name = "twitter:image";
      return meta;
    }, DEFAULT_IMAGE);

    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    const breadcrumbItems = [
      {
        "@type": "ListItem",
        position: 1,
        name: "Ana Sayfa",
        item: `${SITE_URL}/`,
      },
    ];

    if (config.canonicalPath !== "/") {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 2,
        name: config.breadcrumb,
        item: canonicalUrl,
      });
    }

    setJsonLd("llinktr-static-jsonld", [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Llinktr",
        url: SITE_URL,
        logo: DEFAULT_IMAGE,
        sameAs: ["https://www.instagram.com/llinktr.destek/"],
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Llinktr",
        url: SITE_URL,
        description: "Bio link sayfas1 olu_turma platformu",
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems,
      },
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Llinktr",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "TRY",
        },
        description: DEFAULT_DESCRIPTION,
      },
    ]);
  }, [location]);

  return null;
}

