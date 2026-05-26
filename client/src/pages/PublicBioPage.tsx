import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  COMMERCE_LINK_PRESETS,
  LOCATION_LINK_PRESETS,
  SOCIAL_PLATFORMS,
  getBioBackgroundStyleStatic,
  getBioButtonStyle,
  getBioCardStyle,
  getBioTheme,
  isValidHexColor,
  safeAccentColor,
  withCustomBackgroundImage,
} from "@/lib/constants";
import { Loader2, ExternalLink, Globe, UserRound, Zap, Share2, X, Copy, Check, PauseCircle, MapPin } from "lucide-react";
import { Link } from "wouter";
import { SocialIcon } from "@/components/SocialIcon";

type BlockType = "heading" | "description" | "text" | "link" | "social" | "location" | "divider" | "profile_image";

function isVideoMediaUrl(value?: string | null) {
  if (!value) return false;
  return /^data:video\//i.test(value) || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(value);
}

function getLinkAlignment(data: Record<string, string | boolean | number> | null) {
  return data?.align === "left" ? "left" : "center";
}

function getCommercePreset(presetId?: string | null) {
  return COMMERCE_LINK_PRESETS.find(item => item.id === presetId);
}

function getLogoPreset(presetId?: string | null) {
  return getCommercePreset(presetId) || LOCATION_LINK_PRESETS.find(item => item.platform === presetId || item.id === presetId);
}

function getDividerVariant(data: Record<string, string | boolean | number> | null) {
  return data?.variant === "thick" ? "thick" : "thin";
}

function detectMapProvider(rawUrl: string) {
  const value = rawUrl.toLowerCase();
  if (value.includes("maps.apple.com")) return "apple_maps";
  if (value.includes("google.com/maps") || value.includes("maps.google.") || value.includes("maps.app.goo.gl") || value.includes("goo.gl/maps")) return "google_maps";
  return "auto_maps";
}

function getLocationProviderLabel(provider?: string | number | boolean) {
  if (provider === "google_maps") return "Google Maps";
  if (provider === "apple_maps") return "Apple Maps";
  return "Otomatik";
}

function getValidCoordinates(data: Record<string, string | boolean | number> | null | undefined) {
  if (!data) return null;
  const lat = String(data.lat || "").trim();
  const lng = String(data.lng || "").trim();
  if (!lat || !lng) return null;
  const latNumber = Number(lat);
  const lngNumber = Number(lng);
  if (!Number.isFinite(latNumber) || !Number.isFinite(lngNumber)) return null;
  if (latNumber < -90 || latNumber > 90 || lngNumber < -180 || lngNumber > 180) return null;
  return { lat: latNumber, lng: lngNumber };
}

function buildMapDirectionsUrl(data: Record<string, string | boolean | number> | null | undefined) {
  if (!data) return "";
  const rawUrl = String(data.url || "").trim();
  if (rawUrl) return rawUrl;

  const provider = data.provider === "auto_maps" && rawUrl ? detectMapProvider(rawUrl) : String(data.provider || "auto_maps");
  const coordinates = getValidCoordinates(data);
  const query = coordinates ? `${coordinates.lat},${coordinates.lng}` : String(data.address || data.title || "").trim();
  if (!query) return "";

  if (provider === "apple_maps") return `https://maps.apple.com/?daddr=${encodeURIComponent(query)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

function buildMapQuery(data: Record<string, string | boolean | number> | null | undefined) {
  if (!data) return "";
  const coordinates = getValidCoordinates(data);
  if (coordinates) return `${coordinates.lat},${coordinates.lng}`;
  if (data.url && detectMapProvider(String(data.url)) !== "apple_maps") return String(data.url);
  return String(data.address || data.title || "").trim();
}

function buildMapEmbedUrl(data: Record<string, string | boolean | number> | null | undefined) {
  const provider = data?.provider === "auto_maps" && data?.url ? detectMapProvider(String(data.url)) : String(data?.provider || "auto_maps");
  if (provider === "apple_maps") return "";
  const query = buildMapQuery(data) || "39.0,35.0";
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

function getRadiusValue(preset?: string | number | boolean) {
  if (preset === "pill") return "9999px";
  if (preset === "square") return "12px";
  return "18px";
}

function getFontPresetClass(preset?: string | number | boolean) {
  switch (preset) {
    case "bold":
      return "font-bold tracking-[0.01em]";
    case "caps":
      return "font-semibold uppercase tracking-[0.12em]";
    case "wide":
      return "font-semibold tracking-[0.06em]";
    case "compact":
      return "font-medium";
    default:
      return "font-semibold";
  }
}

function getTextStyleClass(preset?: string | number | boolean) {
  switch (preset) {
    case "bold":
      return "font-bold";
    case "light":
      return "font-light";
    case "display":
      return "text-xl font-bold";
    case "small":
      return "text-xs font-medium";
    case "accent":
      return "font-semibold underline underline-offset-4";
    default:
      return "font-medium";
  }
}

function getTextAlignClass(align?: string | number | boolean) {
  if (align === "left") return "text-left";
  if (align === "right") return "text-right";
  return "text-center";
}

function getTextStyleInline(preset?: string | number | boolean): CSSProperties {
  switch (preset) {
    case "bold":
      return { fontWeight: 800 };
    case "light":
      return { fontWeight: 300 };
    case "display":
      return { fontSize: "1.45em", fontWeight: 850, lineHeight: 1.15 };
    case "small":
      return { fontSize: "0.86em", fontWeight: 500 };
    case "accent":
      return { fontWeight: 750, letterSpacing: "0.02em" };
    default:
      return { fontWeight: 500 };
  }
}

function getTextLinkParts(text: string, data: Record<string, string | boolean | number> | null | undefined) {
  if (!data) return null;
  const start = Number(data.textLinkStart);
  const end = Number(data.textLinkEnd);
  const url = String(data.textLinkUrl || "");
  if (!url || Number.isNaN(start) || Number.isNaN(end) || start < 0 || end <= start || end > text.length) return null;
  return { before: text.slice(0, start), linked: text.slice(start, end), after: text.slice(end), url };
}

function RichText({
  text,
  data,
  linkColor,
}: {
  text: string;
  data: Record<string, string | boolean | number> | null | undefined;
  linkColor: string;
}) {
  const parts = getTextLinkParts(text, data);
  if (!parts) return <>{text}</>;
  return (
    <>
      {parts.before}
      <a href={parts.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4" style={{ color: linkColor }}>
        {parts.linked}
      </a>
      {parts.after}
    </>
  );
}

function getSocialPlacement(data: Record<string, string | boolean | number> | null | undefined) {
  return data?.placement === "top" ? "top" : "inline";
}

type SocialAccountData = {
  id: string;
  platform: string;
  url: string;
  isEnabled: boolean;
};

function getInlineSocialAccounts(data: Record<string, string | boolean | number> | null | undefined): SocialAccountData[] {
  if (!data) return [];

  if (typeof data.accounts === "string" && data.accounts.trim()) {
    try {
      const parsed = JSON.parse(data.accounts) as Array<Partial<SocialAccountData>>;
      if (Array.isArray(parsed)) {
        return parsed
          .map((item, index) => ({
            id: String(item.id || `legacy_${index}`),
            platform: String(item.platform || ""),
            url: String(item.url || ""),
            isEnabled: item.isEnabled !== false,
          }));
      }
    } catch {
      // Old social records are handled below.
    }
  }

  if (data.platform || data.url) {
    return [
      {
        id: "legacy_0",
        platform: String(data.platform || ""),
        url: String(data.url || ""),
        isEnabled: true,
      },
    ];
  }

  return [];
}

export default function PublicBioPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, error } = trpc.bioPages.getBySlug.useQuery(
    { slug: slug || "" },
    {
      enabled: !!slug,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 15,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  );
  const pageUrl = typeof window !== "undefined" && slug ? `${window.location.origin}/${slug}` : "";
  const [shareOpen, setShareOpen] = useState(false);
  const [photoModal, setPhotoModal] = useState<{ url: string; title?: string; description?: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!data?.page) return;

    const defaultIcon = "/favicon.svg";
    const nextIcon = data.page.faviconUrl || defaultIcon;
    const resolvedPageUrl = slug ? `${window.location.origin}/${slug}` : window.location.origin;
    const nextTitle = `${data.page.title} | llinktr`;
    const nextDescription = (data.page.description || "").trim() || "llinktr ile linklerinizi tek sayfada toplayin.";
    const nextImage = data.page.profileImageUrl || nextIcon;

    const iconEl = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    const shortcutEl = document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement | null;
    const prevIcon = iconEl?.href;
    const prevShortcut = shortcutEl?.href;
    const prevTitle = document.title;
    const prevCanonical = (document.querySelector("link[rel='canonical']") as HTMLLinkElement | null)?.href;

    const getMetaContent = (selector: string) =>
      (document.querySelector(selector) as HTMLMetaElement | null)?.content ?? null;

    const prevMeta = {
      description: getMetaContent("meta[name='description']"),
      ogTitle: getMetaContent("meta[property='og:title']"),
      ogDescription: getMetaContent("meta[property='og:description']"),
      ogUrl: getMetaContent("meta[property='og:url']"),
      ogImage: getMetaContent("meta[property='og:image']"),
      twitterCard: getMetaContent("meta[name='twitter:card']"),
      twitterTitle: getMetaContent("meta[name='twitter:title']"),
      twitterDescription: getMetaContent("meta[name='twitter:description']"),
      twitterImage: getMetaContent("meta[name='twitter:image']"),
      robots: getMetaContent("meta[name='robots']"),
    };

    const ensureMeta = (
      selector: string,
      create: () => HTMLMetaElement,
    ): { el: HTMLMetaElement; existed: boolean } => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      const existed = Boolean(el);
      if (!el) {
        el = create();
        document.head.appendChild(el);
      }
      return { el, existed };
    };

    const ensureCanonicalLink = (): { el: HTMLLinkElement; existed: boolean } => {
      let el = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
      const existed = Boolean(el);
      if (!el) {
        el = document.createElement("link");
        el.rel = "canonical";
        document.head.appendChild(el);
      }
      return { el, existed };
    };

    const ensureLink = (rel: "icon" | "shortcut icon") => {
      let link = document.querySelector(`link[rel='${rel}']`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = nextIcon;
      return link;
    };

    ensureLink("icon");
    ensureLink("shortcut icon");
    document.title = nextTitle;

    const { el: canonicalEl, existed: canonicalExisted } = ensureCanonicalLink();
    canonicalEl.href = resolvedPageUrl;

    const { el: descEl, existed: descExisted } = ensureMeta("meta[name='description']", () => {
      const meta = document.createElement("meta");
      meta.name = "description";
      return meta;
    });
    descEl.content = nextDescription;

    const { el: robotsEl, existed: robotsExisted } = ensureMeta("meta[name='robots']", () => {
      const meta = document.createElement("meta");
      meta.name = "robots";
      return meta;
    });
    robotsEl.content = "index,follow";

    const { el: ogTitleEl, existed: ogTitleExisted } = ensureMeta("meta[property='og:title']", () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:title");
      return meta;
    });
    ogTitleEl.content = nextTitle;

    const { el: ogDescEl, existed: ogDescExisted } = ensureMeta("meta[property='og:description']", () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:description");
      return meta;
    });
    ogDescEl.content = nextDescription;

    const { el: ogUrlEl, existed: ogUrlExisted } = ensureMeta("meta[property='og:url']", () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:url");
      return meta;
    });
    ogUrlEl.content = resolvedPageUrl;

    const { el: ogImageEl, existed: ogImageExisted } = ensureMeta("meta[property='og:image']", () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:image");
      return meta;
    });
    ogImageEl.content = nextImage;

    const { el: twCardEl, existed: twCardExisted } = ensureMeta("meta[name='twitter:card']", () => {
      const meta = document.createElement("meta");
      meta.name = "twitter:card";
      return meta;
    });
    twCardEl.content = "summary";

    const { el: twTitleEl, existed: twTitleExisted } = ensureMeta("meta[name='twitter:title']", () => {
      const meta = document.createElement("meta");
      meta.name = "twitter:title";
      return meta;
    });
    twTitleEl.content = nextTitle;

    const { el: twDescEl, existed: twDescExisted } = ensureMeta("meta[name='twitter:description']", () => {
      const meta = document.createElement("meta");
      meta.name = "twitter:description";
      return meta;
    });
    twDescEl.content = nextDescription;

    const { el: twImageEl, existed: twImageExisted } = ensureMeta("meta[name='twitter:image']", () => {
      const meta = document.createElement("meta");
      meta.name = "twitter:image";
      return meta;
    });
    twImageEl.content = nextImage;

    return () => {
      const icon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      const shortcut = document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement | null;
      if (icon) icon.href = prevIcon || defaultIcon;
      if (shortcut) shortcut.href = prevShortcut || defaultIcon;
      document.title = prevTitle || "llinktr";

      const canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
      if (canonical) {
        if (!canonicalExisted) canonical.remove();
        else canonical.href = prevCanonical || resolvedPageUrl;
      }

      const maybeRestoreMeta = (
        selector: string,
        existed: boolean,
        prevValue: string | null,
      ) => {
        const el = document.querySelector(selector) as HTMLMetaElement | null;
        if (!el) return;
        if (!existed) {
          el.remove();
          return;
        }
        if (prevValue === null) {
          el.removeAttribute("content");
          return;
        }
        el.content = prevValue;
      };

      maybeRestoreMeta("meta[name='description']", descExisted, prevMeta.description);
      maybeRestoreMeta("meta[name='robots']", robotsExisted, prevMeta.robots);
      maybeRestoreMeta("meta[property='og:title']", ogTitleExisted, prevMeta.ogTitle);
      maybeRestoreMeta("meta[property='og:description']", ogDescExisted, prevMeta.ogDescription);
      maybeRestoreMeta("meta[property='og:url']", ogUrlExisted, prevMeta.ogUrl);
      maybeRestoreMeta("meta[property='og:image']", ogImageExisted, prevMeta.ogImage);
      maybeRestoreMeta("meta[name='twitter:card']", twCardExisted, prevMeta.twitterCard);
      maybeRestoreMeta("meta[name='twitter:title']", twTitleExisted, prevMeta.twitterTitle);
      maybeRestoreMeta("meta[name='twitter:description']", twDescExisted, prevMeta.twitterDescription);
      maybeRestoreMeta("meta[name='twitter:image']", twImageExisted, prevMeta.twitterImage);
    };
  }, [data?.page, slug]);

  useEffect(() => {
    if (!shareOpen || !pageUrl) return;

    let isMounted = true;
    setQrDataUrl(null);

    import("qrcode")
      .then(module => module.default.toDataURL(pageUrl, {
        width: 420,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      }))
      .then((dataUrl) => {
        if (isMounted) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (isMounted) setQrDataUrl("");
      });

    return () => {
      isMounted = false;
    };
  }, [shareOpen, pageUrl]);

  useEffect(() => {
    if (!photoModal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPhotoModal(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [photoModal]);

  const copyShareLink = async () => {
    if (!pageUrl) return;
    try {
      await navigator.clipboard?.writeText(pageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const shareNative = async () => {
    if (!pageUrl) return;
    if (navigator.share) {
      await navigator.share({
        title: data?.page.title || "llinktr",
        text: "llinktr ile sen de paylaş",
        url: pageUrl,
      });
      return;
    }

    await copyShareLink();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070d]">
        <Loader2 className="h-8 w-8 animate-spin text-[#22D3EE]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#05070d] text-white px-4">
        <Globe className="h-12 w-12 text-gray-600 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Sayfa bulunamadı</h1>
        <p className="text-gray-400 mb-6 text-center">Bu bio sayfası mevcut değil, kaldırılmış veya yayını durdurulmuş.</p>
        <Link href="/">
          <button className="px-4 py-2 rounded-lg bg-[#22D3EE] text-black text-sm font-semibold">
            Ana Sayfaya Dön
          </button>
        </Link>
      </div>
    );
  }

  const isPaused = Boolean((data as { isPaused?: boolean })?.isPaused || !data.page?.isPublished);

  if (isPaused) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#05070d] text-white px-4">
        <PauseCircle className="h-12 w-12 text-amber-300 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Bu sayfa şuanlık tatil modunda</h1>
        <p className="text-gray-300 mb-6 text-center">Sayfa sahibi yayını geçici olarak durdurdu. Lütfen daha sonra tekrar ziyaret edin.</p>
        <Link href="/">
          <button className="px-4 py-2 rounded-lg bg-[#22D3EE] text-black text-sm font-semibold">
            Ana Sayfaya Dön
          </button>
        </Link>
      </div>
    );
  }

  const { page, blocks } = data;
  const savedThemeSettings = page as typeof page & {
    textColor?: string | null;
    customBackgroundImageUrl?: string | null;
  };
  const themeConfig = withCustomBackgroundImage(getBioTheme(page.theme), savedThemeSettings.customBackgroundImageUrl);
  const accent = safeAccentColor(page.accentColor, themeConfig.accent);
  const resolvedTextColor = isValidHexColor(savedThemeSettings.textColor || "") ? savedThemeSettings.textColor! : themeConfig.text;
  const enabledBlocks = blocks.filter(block => block.isEnabled);
  const contentBlocks = enabledBlocks.filter(block => block.type !== "social" || getSocialPlacement(block.data as Record<string, string | boolean | number> | null) !== "top");
  const topSocialBlocks = enabledBlocks.filter(block => block.type === "social" && (block.data as Record<string, string | boolean | number> | null)?.url && getSocialPlacement(block.data as Record<string, string | boolean | number> | null) === "top");
  const buttonStyle = getBioButtonStyle(themeConfig, accent, resolvedTextColor);

  const getSocialLabel = (block: typeof blocks[number]) => {
    const blockData = block.data as Record<string, string | boolean | number> | null;
    const platform = SOCIAL_PLATFORMS.find(item => item.id === blockData?.platform);
    return platform?.label || "Sosyal hesap";
  };

  const getSocialColor = (block: typeof blocks[number]) => {
    const blockData = block.data as Record<string, string | boolean | number> | null;
    const platform = SOCIAL_PLATFORMS.find(item => item.id === blockData?.platform);
    return platform?.color || accent;
  };

  const renderLinkLogo = (blockData: Record<string, string | boolean | number> | null, size: number) => {
    if (blockData?.logoPreset) {
      const preset = getLogoPreset(String(blockData.logoPreset));
      if (preset?.logoUrl) {
        return <img src={preset.logoUrl} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />;
      }

      return <SocialIcon platform={String(blockData.logoPreset)} size={size} color={accent} />;
    }

    if (blockData?.logoUrl) {
      return <img src={String(blockData.logoUrl)} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />;
    }

    return null;
  };

  const renderSecondaryLinkLogo = (blockData: Record<string, string | boolean | number> | null, size: number) => {
    if (!blockData?.logoUrlSecondary) return null;
    return <img src={String(blockData.logoUrlSecondary)} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />;
  };

  const pageBackgroundStyle = getBioBackgroundStyleStatic(themeConfig, accent);
  const cardStyle = getBioCardStyle(themeConfig, resolvedTextColor);

  return (
    <div
      className="public-bio-shell flex min-h-screen flex-col items-center justify-center overflow-x-hidden px-4 pb-8 pt-6 md:px-4 md:py-8"
      style={{
        ...pageBackgroundStyle,
        color: resolvedTextColor,
      }}
    >
      <main
        className="public-bio-card mx-auto flex w-full max-w-[420px] flex-col items-center overflow-x-hidden rounded-[20px] border px-6 pb-6 pt-6 text-center md:max-w-[35rem] md:rounded-[2.35rem] md:p-8 lg:max-w-[37rem]"
        style={{
          ...cardStyle,
          backdropFilter: cardStyle.backdropFilter || "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: cardStyle.boxShadow || "0 24px 64px rgba(0, 0, 0, 0.45)",
        }}
      >
        <div className="mb-4 flex flex-col items-center gap-4 md:mb-4 md:gap-5">
          {page.profileImageUrl ? (
            isVideoMediaUrl(page.profileImageUrl) ? (
              <video
                src={page.profileImageUrl}
                className="mb-4 h-24 w-24 rounded-full border-2 object-cover md:h-28 md:w-28"
                style={{ borderColor: `${accent}66` }}
                muted
                playsInline
                autoPlay
                loop
              />
            ) : (
              <img
                src={page.profileImageUrl}
                alt={page.title}
                className="mb-4 h-24 w-24 rounded-full border-2 object-cover md:h-28 md:w-28"
                style={{ borderColor: `${accent}66` }}
              />
            )
          ) : (
            <div
              className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 md:h-28 md:w-28"
              style={{ borderColor: `${accent}66`, background: `${accent}22` }}
            >
              <UserRound className="h-10 w-10 md:h-11 md:w-11" style={{ color: accent }} />
            </div>
          )}
          <div className="text-center">
            <h1 className="mx-auto mb-2 line-clamp-2 max-w-full overflow-hidden break-words text-xl font-bold [overflow-wrap:anywhere] md:text-[1.7rem]" style={{ color: resolvedTextColor }}>{page.title}</h1>
            {page.description && (
              <p className="mx-auto mb-4 line-clamp-3 max-w-full overflow-hidden break-words text-sm [overflow-wrap:anywhere] md:text-[15px]" style={{ color: resolvedTextColor }}>{page.description}</p>
            )}
            {topSocialBlocks.length > 0 && (
              <div className="mt-1 flex flex-wrap justify-center gap-3 md:mt-3 md:gap-3.5">
                {topSocialBlocks.map(block => {
                  const blockData = block.data as Record<string, string | boolean | number> | null;
                  return (
                    <a
                      key={`top-social-${block.id}`}
                      href={blockData?.url ? `/go/${block.id}` : "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={getSocialLabel(block)}
                      className="flex h-11 w-11 items-center justify-center rounded-full border transition-all hover:-translate-y-0.5 hover:opacity-90 md:h-12 md:w-12"
                      style={{ background: themeConfig.cardBg, borderColor: themeConfig.cardBorder, boxShadow: themeConfig.shadow }}
                    >
                      <SocialIcon platform={String(blockData?.platform || "")} size={22} color={getSocialColor(block)} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="w-full space-y-3.5 md:space-y-4">
          {contentBlocks.map((block) => {
            const blockData = block.data as Record<string, string | boolean | number> | null;
            const blockType = block.type as BlockType;

            if (blockType === "divider") {
              const dividerVariant = getDividerVariant(blockData);
              return (
                <hr
                  key={block.id}
                  className="border-t my-4"
                  style={{
                    borderColor: themeConfig.cardBorder,
                    borderTopWidth: dividerVariant === "thick" ? "4px" : "1px",
                    opacity: dividerVariant === "thick" ? 0.95 : 0.7,
                  }}
                />
              );
            }

            if (blockType === "heading") {
              const headingText = String(blockData?.text || "Baslik");
              const blockTextColor = String(blockData?.textColor || resolvedTextColor);
              return (
                <h2
                  key={block.id}
                  className={`line-clamp-2 max-w-full overflow-hidden break-words py-1 text-lg [overflow-wrap:anywhere] md:text-[1.3rem] ${getTextAlignClass(blockData?.align)}`}
                  style={{ color: blockTextColor, textTransform: blockData?.uppercase ? "uppercase" : "none", ...getTextStyleInline(blockData?.textStyle) }}
                >
                  <RichText text={blockData?.uppercase ? headingText.toUpperCase() : headingText} data={blockData} linkColor={blockTextColor} />
                </h2>
              );
            }

            if ((blockType as string) === "__legacy_heading__") {
              return (
                <h2 key={block.id} className="py-1 text-center text-lg font-bold md:text-[1.3rem]" style={{ color: resolvedTextColor }}>
                  {blockData?.text || "Başlık"}
                </h2>
              );
            }

            if (blockType === "description" || blockType === "text") {
              const blockTextColor = String(blockData?.textColor || resolvedTextColor);
              return (
                <p key={block.id} className={`line-clamp-3 max-w-full overflow-hidden break-words px-2 text-sm leading-relaxed [overflow-wrap:anywhere] md:text-[15px] ${getTextAlignClass(blockData?.align)}`} style={{ color: blockTextColor, ...getTextStyleInline(blockData?.textStyle) }}>
                  <RichText text={String(blockData?.text || "")} data={blockData} linkColor={blockTextColor} />
                </p>
              );
            }

            if (blockType === "social" && getSocialPlacement(blockData) !== "top") {
              const accounts = getInlineSocialAccounts(blockData).filter((account) => account.isEnabled !== false && account.platform);
              if (accounts.length === 0) return null;

              return (
                <div key={block.id} className="flex flex-wrap justify-center gap-3 py-2 md:gap-3.5">
                  {accounts.map((account) => {
                    const platform = SOCIAL_PLATFORMS.find((item) => item.id === account.platform);
                    return (
                      <a
                        key={account.id}
                        href={account.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={platform?.label || "Sosyal hesap"}
                        className="flex h-11 w-11 items-center justify-center rounded-full border transition-all hover:-translate-y-0.5 hover:opacity-90 md:h-12 md:w-12"
                        style={{ background: themeConfig.cardBg, borderColor: themeConfig.cardBorder, boxShadow: themeConfig.shadow }}
                      >
                        <SocialIcon platform={account.platform} size={22} color={platform?.color || accent} />
                      </a>
                    );
                  })}
                </div>
              );
            }

            if (blockType === "location") {
              const title = String(blockData?.title || "Konum");
              const description = String(blockData?.description || "");
              const address = String(blockData?.address || "");
              const buttonText = String(blockData?.buttonText || "Yol Tarifi Al");
              const provider = blockData?.provider === "auto_maps" && blockData?.url ? detectMapProvider(String(blockData.url)) : String(blockData?.provider || "auto_maps");
              const mapEmbedUrl = buildMapEmbedUrl(blockData);
              const directionsUrl = buildMapDirectionsUrl(blockData);

              return (
                <div
                  key={block.id}
                  className="mx-auto w-full max-w-[20rem] overflow-hidden rounded-[1.2rem] border text-left md:max-w-none"
                  style={{ background: themeConfig.cardBg, borderColor: themeConfig.cardBorder, boxShadow: themeConfig.shadow }}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border" style={{ borderColor: themeConfig.cardBorder, background: `${accent}18` }}>
                        <MapPin className="h-5 w-5" style={{ color: accent }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <p className="line-clamp-1 text-sm font-bold md:text-base" style={{ color: resolvedTextColor }}>{title}</p>
                          {provider !== "auto_maps" ? (
                            <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={{ borderColor: themeConfig.cardBorder, color: resolvedTextColor }}>
                              {getLocationProviderLabel(provider)}
                            </span>
                          ) : null}
                        </div>
                        {description ? <p className="mt-1 line-clamp-2 text-xs leading-relaxed opacity-75" style={{ color: resolvedTextColor }}>{description}</p> : null}
                        {address ? <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed opacity-65" style={{ color: resolvedTextColor }}>{address}</p> : null}
                      </div>
                    </div>
                  </div>
                  {provider === "apple_maps" ? (
                    <div className="grid h-32 place-items-center bg-[radial-gradient(circle_at_center,rgba(214,255,0,0.13),transparent_55%),linear-gradient(135deg,#171b20,#090b0d)] md:h-40">
                      <div className="text-center">
                        <MapPin className="mx-auto mb-1 h-6 w-6" style={{ color: accent }} />
                        <p className="text-xs font-semibold" style={{ color: resolvedTextColor }}>Harita konumu</p>
                      </div>
                    </div>
                  ) : mapEmbedUrl ? (
                    <iframe
                      title={`${title} harita onizlemesi`}
                      src={mapEmbedUrl}
                      loading="lazy"
                      className="h-32 w-full border-0 md:h-40"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <div className="grid h-32 place-items-center bg-[radial-gradient(circle_at_center,rgba(214,255,0,0.13),transparent_55%),linear-gradient(135deg,#171b20,#090b0d)] md:h-40">
                      <MapPin className="h-6 w-6" style={{ color: accent }} />
                    </div>
                  )}
                  <div className="p-4 pt-3">
                    <a
                      href={directionsUrl ? `/go/${block.id}` : "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid min-h-11 place-items-center rounded-xl border px-3 text-center text-sm font-extrabold shadow-[0_0_18px_rgba(214,255,0,0.20)] transition hover:border-white/80 hover:opacity-95 hover:shadow-[0_0_28px_rgba(214,255,0,0.42)] active:scale-[0.98]"
                      style={{ background: accent, color: "#05070a", borderColor: "rgba(255,255,255,0.42)" }}
                    >
                      {buttonText}
                    </a>
                  </div>
                </div>
              );
            }

            if (blockType === "link") {
              const align = getLinkAlignment(blockData);
              const logo = renderLinkLogo(blockData, 30);
              const secondaryLogo = renderSecondaryLinkLogo(blockData, 16);
              const linkStyle = {
                ...buttonStyle,
                color: String(blockData?.textColor || resolvedTextColor),
                background: String(blockData?.bgColor || (buttonStyle.background as string)),
                borderColor: String(blockData?.borderColor || (buttonStyle.borderColor as string)),
                borderWidth: `${Number(blockData?.borderWidth ?? 1)}px`,
                borderRadius: getRadiusValue(blockData?.radiusPreset),
              } as React.CSSProperties;
              const fontPresetClass = getFontPresetClass(blockData?.fontPreset);

              return (
                <a
                  key={block.id}
                  href={blockData?.url ? `/go/${block.id}` : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-card link-button mx-auto grid min-h-[4.35rem] w-full max-w-[20rem] content-center place-items-center overflow-visible rounded-[14px] border px-4 py-3.5 transition-all hover:opacity-90 active:scale-[0.98] md:min-h-[5.1rem] md:max-w-none md:rounded-[1.2rem] md:px-7"
                  style={linkStyle}
                >
                  <div className="relative grid h-full w-full place-items-center self-stretch">
                    <div className="absolute left-0 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full md:h-9 md:w-9">
                      {logo || secondaryLogo ? (
                        <div className="relative h-8 w-8 md:h-9 md:w-9">
                          <div className="absolute left-0 top-0">{logo}</div>
                          {secondaryLogo && (
                            <div className="absolute -bottom-1 -right-1 rounded-full border bg-white/95 p-[1px]" style={{ borderColor: themeConfig.cardBorder }}>
                              {secondaryLogo}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="h-8 w-8 rounded-full md:h-9 md:w-9" />
                      )}
                    </div>
                    <span className={`link-title flex min-h-full w-full min-w-0 max-w-full items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap px-8 text-center text-xs md:px-12 md:text-base ${fontPresetClass} ${align === "left" ? "sm:justify-start sm:text-left" : ""}`} style={{ color: String(blockData?.textColor || resolvedTextColor) }}>
                      {blockData?.title || "Link"}
                    </span>
                    <ExternalLink className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60 md:h-[18px] md:w-[18px]" style={{ color: String(blockData?.textColor || resolvedTextColor) }} />
                  </div>
                </a>
              );
            }

            if (blockType === "profile_image" && blockData?.url) {
              const aspect = String(blockData.aspect || "1/1");
              const align = String(blockData.align || "center") as "left" | "center" | "right";
              const caption = (blockData.title || blockData.description) ? (
                <div className="space-y-1" style={{ textAlign: align }}>
                  {blockData.title && <h3 className="text-sm font-bold md:text-base" style={{ color: String(blockData.titleColor || resolvedTextColor) }}>{blockData.title}</h3>}
                  {blockData.description && <p className="text-xs leading-relaxed md:text-sm" style={{ color: String(blockData.descriptionColor || resolvedTextColor) }}>{blockData.description}</p>}
                </div>
              ) : null;
              const image = (
                <img
                  src={String(blockData.url)}
                  alt={String(blockData.title || "Foto")}
                  className="w-full rounded-2xl object-cover border"
                  style={{ aspectRatio: aspect === "auto" ? "auto" : aspect, borderColor: themeConfig.cardBorder }}
                />
              );
              return (
                <div key={block.id} className="py-2">
                  <div className="mx-auto w-full max-w-md space-y-2">
                    {blockData.textPosition === "above" && caption}
                    {blockData.openInModal ? (
                      <button
                        type="button"
                        className="block w-full overflow-hidden rounded-2xl transition hover:scale-[1.01] active:scale-[0.99]"
                        onClick={() => setPhotoModal({ url: String(blockData.url), title: String(blockData.title || ""), description: String(blockData.description || "") })}
                      >
                        {image}
                      </button>
                    ) : image}
                    {blockData.textPosition !== "above" && caption}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 md:mt-12" style={{ color: resolvedTextColor }}>
          <Zap className="h-3.5 w-3.5" />
          <Link href="/" className="text-xs font-medium hover:opacity-70 transition-opacity">
            llinktr ile sen de paylaş
          </Link>
        </div>
      </main>

      <button
        type="button"
        onClick={() => setShareOpen(true)}
        className="fixed bottom-5 right-5 z-20 flex h-12 w-12 items-center justify-center rounded-full border shadow-xl transition-transform hover:scale-105 active:scale-95"
        style={{ background: accent, color: themeConfig.buttonText === "#FFFFFF" ? "#111827" : "#FFFFFF", borderColor: `${accent}66` }}
        aria-label="Paylaş"
      >
        <Share2 className="h-5 w-5" />
      </button>

      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.6rem] bg-white p-5 text-slate-900 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-slate-700" />
                <h2 className="text-lg font-semibold">Paylaş</h2>
              </div>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-white p-2 ring-1 ring-slate-200">
              {qrDataUrl === null && (
                <div className="flex aspect-square items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              )}
              {qrDataUrl === "" && (
                <div className="flex aspect-square items-center justify-center text-center text-sm text-slate-500">
                  QR kod oluşturulamadı.
                </div>
              )}
              {qrDataUrl && (
                <img src={qrDataUrl} alt="Sayfa QR kodu" className="aspect-square w-full rounded-xl object-contain" />
              )}
            </div>

            <div className="mt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => void shareNative().catch(() => copyShareLink())}
                className="h-11 w-11 rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 flex items-center justify-center"
                aria-label="Paylaş"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => void copyShareLink()}
                className="h-11 w-11 rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 flex items-center justify-center"
                aria-label="Bağlantıyı kopyala"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-4 flex overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <span className="min-w-0 flex-1 truncate px-3 py-3 text-sm text-slate-700">{pageUrl}</span>
              <button
                type="button"
                onClick={() => void copyShareLink()}
                className="flex w-12 items-center justify-center bg-slate-200 text-slate-700 transition-colors hover:bg-slate-300"
                aria-label="Bağlantıyı kopyala"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-700" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <Link href="/" className="mt-4 block text-center text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900">
              llinktr ile sen de paylaş
            </Link>
          </div>
        </div>
      )}

      {photoModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-3 py-4 backdrop-blur-sm" onClick={() => setPhotoModal(null)}>
          <div className="relative w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPhotoModal(null)}
              className="absolute right-3 top-3 z-10 rounded-full border border-white/15 bg-black/70 p-2 text-white"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={photoModal.url} alt={photoModal.title || "Foto"} className="max-h-[82svh] w-full rounded-2xl object-contain" />
            {(photoModal.title || photoModal.description) && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/65 p-4 text-white">
                {photoModal.title && <h3 className="font-bold">{photoModal.title}</h3>}
                {photoModal.description && <p className="mt-1 text-sm text-white/75">{photoModal.description}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
