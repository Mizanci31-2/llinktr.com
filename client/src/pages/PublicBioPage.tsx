import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  COMMERCE_LINK_PRESETS,
  SOCIAL_PLATFORMS,
  getBioBackgroundStyle,
  getBioButtonStyle,
  getBioCardStyle,
  getBioTheme,
  safeAccentColor,
} from "@/lib/constants";
import { Loader2, ExternalLink, Globe, UserRound, Zap, Share2, X, Copy, Check, PauseCircle } from "lucide-react";
import { Link } from "wouter";
import { SocialIcon } from "@/components/SocialIcon";

type BlockType = "heading" | "description" | "text" | "link" | "social" | "divider" | "profile_image";

function getLinkAlignment(data: Record<string, string | boolean | number> | null) {
  return data?.align === "left" ? "left" : "center";
}

function getCommercePreset(presetId?: string | null) {
  return COMMERCE_LINK_PRESETS.find(item => item.id === presetId);
}

function getDividerVariant(data: Record<string, string | boolean | number> | null) {
  return data?.variant === "thick" ? "thick" : "thin";
}

export default function PublicBioPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, error } = trpc.bioPages.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug },
  );
  const pageUrl = typeof window !== "undefined" && slug ? `${window.location.origin}/${slug}` : "";
  const [shareOpen, setShareOpen] = useState(false);
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
  const themeConfig = getBioTheme(page.theme);
  const accent = safeAccentColor(page.accentColor, themeConfig.accent);
  const enabledBlocks = blocks.filter(block => block.isEnabled);
  const contentBlocks = enabledBlocks.filter(block => block.type !== "social");
  const socialBlocks = enabledBlocks.filter(block => block.type === "social" && (block.data as Record<string, string | boolean | number> | null)?.url);
  const buttonStyle = getBioButtonStyle(themeConfig, accent);

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
      const preset = getCommercePreset(String(blockData.logoPreset));
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

  return (
    <div
      className="min-h-screen overflow-x-hidden px-0 py-0 md:flex md:items-center md:justify-center md:px-4 md:py-8"
      style={{ ...getBioBackgroundStyle(themeConfig, accent), color: themeConfig.text }}
    >
      <main
        className="mx-auto flex w-full max-w-none flex-col items-center overflow-x-hidden border-0 px-4 pb-6 pt-[10vh] text-center sm:px-5 sm:pb-7 md:max-w-[35rem] md:rounded-[2.35rem] md:border md:p-8 lg:max-w-[37rem]"
        style={getBioCardStyle(themeConfig)}
      >
        <div className="mb-3 flex flex-col items-center gap-4 md:mb-4 md:gap-5">
          {page.profileImageUrl ? (
            <img
              src={page.profileImageUrl}
              alt={page.title}
              className="h-24 w-24 rounded-full object-cover border-2 md:h-28 md:w-28"
              style={{ borderColor: `${accent}66` }}
            />
          ) : (
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full border-2 md:h-28 md:w-28"
              style={{ borderColor: `${accent}66`, background: `${accent}22` }}
            >
              <UserRound className="h-10 w-10 md:h-11 md:w-11" style={{ color: accent }} />
            </div>
          )}
          <div className="text-center">
            <h1 className="text-xl font-bold md:text-[1.7rem]" style={{ color: themeConfig.text }}>{page.title}</h1>
            {page.description && (
              <p className="mt-1 text-sm md:text-[15px]" style={{ color: themeConfig.mutedText }}>{page.description}</p>
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
              return (
                <h2
                  key={block.id}
                  className="py-1 text-center text-lg font-bold md:text-[1.3rem]"
                  style={{ color: themeConfig.text, textTransform: blockData?.uppercase ? "uppercase" : "none" }}
                >
                  {blockData?.uppercase ? headingText.toUpperCase() : headingText}
                </h2>
              );
            }

            if ((blockType as string) === "__legacy_heading__") {
              return (
                <h2 key={block.id} className="py-1 text-center text-lg font-bold md:text-[1.3rem]" style={{ color: themeConfig.text }}>
                  {blockData?.text || "Başlık"}
                </h2>
              );
            }

            if (blockType === "description" || blockType === "text") {
              return (
                <p key={block.id} className="px-2 text-center text-sm leading-relaxed md:text-[15px]" style={{ color: themeConfig.mutedText }}>
                  {blockData?.text || ""}
                </p>
              );
            }

            if (blockType === "link") {
              const align = getLinkAlignment(blockData);
              const logo = renderLinkLogo(blockData, 30);
              const secondaryLogo = renderSecondaryLinkLogo(blockData, 16);

              return (
                <a
                  key={block.id}
                  href={blockData?.url ? `/go/${block.id}` : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-auto grid min-h-[4.35rem] w-full max-w-[28rem] content-center place-items-center overflow-hidden rounded-xl border px-4 py-0 transition-all hover:opacity-90 active:scale-[0.98] sm:px-5 md:min-h-[5.1rem] md:max-w-none md:rounded-[1.2rem] md:px-7"
                  style={buttonStyle}
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
                    <span className={`flex h-full w-full min-w-0 items-center justify-center truncate px-10 text-center text-sm font-medium leading-none md:px-12 md:text-base ${align === "left" ? "sm:justify-start sm:text-left" : ""}`}>
                      {blockData?.title || "Link"}
                    </span>
                    <ExternalLink className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60 md:h-[18px] md:w-[18px]" />
                  </div>
                </a>
              );
            }

            if (blockType === "profile_image" && blockData?.url) {
              return (
                <div key={block.id} className="flex justify-center py-2">
                  <img src={String(blockData.url)} alt="Profil resmi" className="w-28 h-28 rounded-full object-cover border" style={{ borderColor: themeConfig.cardBorder }} />
                </div>
              );
            }

            return null;
          })}
        </div>

        {socialBlocks.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-3 md:mt-9 md:gap-3.5">
            {socialBlocks.map(block => {
              const blockData = block.data as Record<string, string | boolean | number> | null;
              return (
                <a
                  key={block.id}
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

        <div className="mt-10 flex items-center justify-center gap-2 md:mt-12" style={{ color: themeConfig.mutedText }}>
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
    </div>
  );
}
