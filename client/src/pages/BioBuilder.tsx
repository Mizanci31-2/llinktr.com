import { useEffect, useMemo, useRef, useState } from "react";
import type { ElementType } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import {
  BIO_THEMES,
  BLOCK_TYPES,
  COMMERCE_LINK_PRESETS,
  LOCATION_LINK_PRESETS,
  MAX_PROFILE_IMAGE_BYTES,
  SOCIAL_PLATFORMS,
  THEME_CATEGORY_TABS,
  getThemeCategory,
  getBioBackgroundStyle,
  getBioBackgroundStyleStatic,
  getBioButtonStyle,
  getBioCardStyle,
  getBioTheme,
  getBioThemePreviewStyle,
  safeAccentColor,
  themeHasImageBackground,
  withCustomBackgroundImage,
} from "@/lib/constants";
import { SocialIcon } from "@/components/SocialIcon";
import { BlockLibraryDialog } from "@/components/bio-builder/BlockLibraryDialog";
import { BlockListPanel } from "@/components/bio-builder/BlockListPanel";
import { BuilderPreviewPanel } from "@/components/bio-builder/BuilderPreviewPanel";
import { BuilderTopBar } from "@/components/bio-builder/BuilderTopBar";
import { ProfileHeroCard } from "@/components/bio-builder/ProfileHeroCard";
import { ProfileImageModal } from "@/components/bio-builder/ProfileImageModal";
import { ProfileTextModal } from "@/components/bio-builder/ProfileTextModal";
import { SocialLinksModal } from "@/components/bio-builder/SocialLinksModal";
import { ThemePanelCard } from "@/components/bio-builder/ThemePanelCard";
import type { BlockType, LocalBlock, SocialLinkDraft } from "@/components/bio-builder/types";
import { formatCompactUrl, isVideoMediaUrl } from "@/components/bio-builder/utils";
import {
  AlignLeft,
  AlignCenter,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  Globe,
  GripVertical,
  Heading1,
  Image,
  Info,
  Link,
  Loader2,
  Minus,
  Monitor,
  MousePointerClick,
  MessageCircle,
  MapPin,
  Plus,
  Save,
  Share2,
  Store,
  Smartphone,
  Trash2,
  Type,
  Upload,
  UserRound,
  X,
} from "lucide-react";

const BLOCK_ICONS: Record<BlockType, ElementType> = {
  heading: Heading1,
  description: AlignLeft,
  text: Type,
  link: Link,
  social: Share2,
  divider: Minus,
  profile_image: Image,
};

const BLOCK_LABELS: Record<BlockType, string> = {
  heading: "Baslik",
  description: "Aciklama",
  text: "Metin",
  link: "Link",
  social: "Sosyal Hesap",
  divider: "Ince Cizgi",
  profile_image: "Logo / Gorsel",
};

const QUICK_PALETTES = [
  { label: "Neon", accent: "#D6FF00", text: "#F8FAFC" },
  { label: "Buz", accent: "#7DD3FC", text: "#F8FAFC" },
  { label: "Mint", accent: "#86EFAC", text: "#F8FAFC" },
  { label: "Pembe", accent: "#F472B6", text: "#FFF7FB" },
  { label: "Altin", accent: "#FBBF24", text: "#FFFBEB" },
];

const SMART_PRESETS = [
  { kind: "influencer", label: "Influencer", desc: "Sosyal hesap + one cikan icerik", accent: "#D6FF00" },
  { kind: "sales", label: "Satis", desc: "WhatsApp + urun/satis linki", accent: "#86EFAC" },
  { kind: "freelancer", label: "Freelancer", desc: "Portfolyo + teklif al", accent: "#7DD3FC" },
] as const;

const LINK_STYLE_TEMPLATES = [
  { id: "clean", label: "Temiz", patch: { bgColor: "", textColor: "", borderColor: "", borderWidth: 1, radiusPreset: "soft", fontPreset: "clean" } },
  { id: "glass", label: "Cam", patch: { bgColor: "rgba(255,255,255,0.08)", textColor: "", borderColor: "rgba(255,255,255,0.16)", borderWidth: 1, radiusPreset: "soft", fontPreset: "clean" } },
  { id: "solid", label: "Dolu", patch: { bgColor: "#1f2329", textColor: "#F8FAFC", borderColor: "#3b4048", borderWidth: 1, radiusPreset: "soft", fontPreset: "bold" } },
  { id: "pill", label: "Pill", patch: { bgColor: "#181c21", textColor: "", borderColor: "", borderWidth: 1, radiusPreset: "pill", fontPreset: "bold" } },
  { id: "spot", label: "Spot", patch: { bgColor: "#242a31", textColor: "#FFFFFF", borderColor: "#D6FF00", borderWidth: 2, radiusPreset: "square", fontPreset: "caps" } },
] as const;

function isTemplateActive(
  data: Record<string, string | boolean | number>,
  patch: Record<string, string | boolean | number>,
) {
  return Object.entries(patch).every(([key, value]) => {
    const current = data[key];
    if (value === "") {
      return current === undefined || current === "";
    }
    return current === value;
  });
}

function normalizeColorInput(value: string, fallback: string) {
  const trimmed = value.trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed) ? trimmed : fallback;
}

function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function normalizeBlocks(blocks: LocalBlock[]) {
  return blocks.map((block, index) => ({ ...block, sortOrder: index }));
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

function makeSocialAccountId() {
  return `social_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

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
      // Legacy records may not have JSON accounts yet.
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

function withInlineSocialAccounts(
  data: Record<string, string | boolean | number>,
  accounts: SocialAccountData[],
) {
  const nextData: Record<string, string | boolean | number> = {
    ...data,
    placement: "inline",
    accounts: JSON.stringify(accounts),
  };
  delete nextData.platform;
  delete nextData.url;
  return nextData;
}

function sanitizeBlockData(data: Record<string, string | boolean | number>) {
  return Object.fromEntries(
    Object.entries(data).filter((entry): entry is [string, string | boolean | number] => {
      const value = entry[1];
      return typeof value === "string" || typeof value === "boolean" || typeof value === "number";
    }),
  );
}

function serializeBlocksForSave(blocks: Array<{ id?: number | null; type: string; sortOrder: number; isEnabled: boolean; data: unknown }>) {
  return JSON.stringify(
    blocks.map((block, index) => ({
      id: block.id ?? null,
      type: block.type,
      sortOrder: index,
      isEnabled: block.isEnabled,
      data: block.data ?? {},
    })),
  );
}

async function uploadImageFile(file: File) {
  const presignResponse = await fetch("/api/storage/presign-put", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ contentType: file.type, size: file.size }),
  });
  const presignData = await presignResponse.json().catch(() => null) as { uploadUrl?: string; url?: string; message?: string } | null;

  if (!presignResponse.ok || !presignData?.uploadUrl || !presignData?.url) {
    throw new Error(presignData?.message || "Gorsel yukleme baglantisi olusturulamadi");
  }

  const uploadResponse = await fetch(presignData.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Gorsel depolama alanina yuklenemedi");
  }

  return presignData.url;
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Gorsel okunamadi"));
    image.src = src;
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Gorsel okunamadi"));
    };
    reader.onerror = () => reject(new Error("Gorsel okunamadi"));
    reader.readAsDataURL(file);
  });
}

async function compressImageFile(file: File, label: string) {
  if (file.type === "image/svg+xml") {
    if (file.size <= 600 * 1024) return readFileAsDataUrl(file);
    throw new Error(`${label} SVG olarak cok buyuk. Lutfen PNG/JPG/WebP yukleyin.`);
  }

  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageElement(originalDataUrl);
  const lowerLabel = label.toLocaleLowerCase("tr");
  const maxSide = lowerLabel.includes("profil")
    ? 520
    : lowerLabel.includes("arka plan")
      ? 900
      : 256;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Gorsel islenemedi");
  }

  context.drawImage(image, 0, 0, width, height);
  const compressed = canvas.toDataURL("image/webp", 0.72);

  if (compressed.length > 650_000) {
    return canvas.toDataURL("image/jpeg", 0.64);
  }

  return compressed;
}

function readImageFile(file: File, onLoaded: (url: string) => void, label = "Gorsel") {
  if (!file.type.startsWith("image/")) {
    toast.error("Lutfen gecerli bir gorsel dosyasi secin");
    return;
  }

  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    toast.error(`${label} en fazla 7 MB olabilir`);
    return;
  }

  const loadingToast = toast.loading(`${label} hazirlaniyor...`);
  void uploadImageFile(file)
    .catch(() => compressImageFile(file, label))
    .then((url) => {
      onLoaded(url);
      toast.success(`${label} yuklendi`, { id: loadingToast });
    })
    .catch((error) => {
      toast.error(error instanceof Error ? error.message : "Gorsel yuklenemedi", { id: loadingToast });
    });
}

function getBlockSummary(block: LocalBlock) {
  if (block.type === "heading") {
    return String(block.data.text || "Buyuk bir baslik ekleyin");
  }

  if (block.type === "description" || block.type === "text") {
    return String(block.data.text || "Aciklama veya serbest metin alani");
  }

  if (block.type === "link") {
    const title = String(block.data.title || (isCommerceLinkData(block.data) ? "E-ticaret sitesi" : "Link"));
    const url = String(block.data.url || "https://...");
    return `${title} - ${url}`;
  }

  if (block.type === "social") {
    if (getSocialPlacement(block.data) !== "top") {
      const accounts = getInlineSocialAccounts(block.data);
      const enabledCount = accounts.filter((account) => account.isEnabled !== false && account.platform).length;
      return enabledCount > 0 ? `${enabledCount} sosyal hesap` : "Sosyal hesaplar blogu";
    }
    const platform = SOCIAL_PLATFORMS.find(item => item.id === block.data.platform);
    return platform ? `${platform.label} hesabi` : "Platform secin";
  }

  if (block.type === "profile_image") {
    return "Logo veya gorsel blogu";
  }

  return "Bolumler arasina ayirici cizgi ekler";
}

function getLinkAlignment(data: Record<string, string | boolean | number>) {
  return data.align === "left" ? "left" : "center";
}

function getCommercePreset(presetId?: string) {
  return COMMERCE_LINK_PRESETS.find(item => item.id === presetId);
}

function getLocationPreset(presetId?: string) {
  return LOCATION_LINK_PRESETS.find(item => item.id === presetId);
}

function getLogoPreset(presetId?: string) {
  return getCommercePreset(presetId) || LOCATION_LINK_PRESETS.find(item => item.platform === presetId || item.id === presetId);
}

function normalizeSocialUrl(platformId: string | undefined, rawValue: string) {
  const value = rawValue.trim();
  if (!value) return "";

  if (platformId === "gmail") {
    if (value.startsWith("mailto:")) return value;
    if (value.includes("@")) return `mailto:${value}`;
  }

  if (platformId === "phone") {
    if (value.startsWith("tel:")) return value;
    const compact = value.replace(/\s+/g, "");
    if (/^\+?[0-9()\-]+$/.test(compact)) {
      const digits = compact.replace(/[()\-]/g, "");
      return `tel:${digits}`;
    }
  }

  return value;
}

function getDividerVariant(data: Record<string, string | boolean | number>) {
  return data.variant === "thick" ? "thick" : "thin";
}

function isCommerceLinkData(data: Record<string, string | boolean | number>) {
  return Boolean(getCommercePreset(String(data.logoPreset || "")));
}

function getBlockLabel(block: LocalBlock) {
  if (block.type === "link" && isCommerceLinkData(block.data)) {
    return "E-ticaret sitesi";
  }

  if (block.type === "divider") {
    return getDividerVariant(block.data) === "thick" ? "Kalin Cizgi" : "Ince Cizgi";
  }

  return BLOCK_LABELS[block.type];
}

function getBlockTone(block: LocalBlock) {
  if (block.type === "link" && isCommerceLinkData(block.data)) {
    return {
      frame: "border-emerald-500/30 bg-emerald-500/[0.05]",
      header: "border-b border-emerald-500/20 bg-emerald-500/[0.08]",
      icon: "text-emerald-400",
      panel: "border-emerald-500/25 bg-emerald-500/[0.04]",
      badge: "bg-emerald-500/10 text-emerald-300",
    };
  }

  switch (block.type) {
    case "heading":
      return {
        frame: "border-sky-500/25 bg-sky-500/[0.04]",
        header: "border-b border-sky-500/15 bg-sky-500/[0.07]",
        icon: "text-sky-400",
        panel: "border-sky-500/20 bg-sky-500/[0.04]",
        badge: "bg-sky-500/10 text-sky-300",
      };
    case "description":
    case "text":
      return {
        frame: "border-violet-500/25 bg-violet-500/[0.04]",
        header: "border-b border-violet-500/15 bg-violet-500/[0.07]",
        icon: "text-violet-400",
        panel: "border-violet-500/20 bg-violet-500/[0.04]",
        badge: "bg-violet-500/10 text-violet-300",
      };
    case "social":
      return {
        frame: "border-pink-500/25 bg-pink-500/[0.04]",
        header: "border-b border-pink-500/15 bg-pink-500/[0.07]",
        icon: "text-pink-400",
        panel: "border-pink-500/20 bg-pink-500/[0.04]",
        badge: "bg-pink-500/10 text-pink-300",
      };
    case "profile_image":
      return {
        frame: "border-amber-500/25 bg-amber-500/[0.04]",
        header: "border-b border-amber-500/15 bg-amber-500/[0.07]",
        icon: "text-amber-400",
        panel: "border-amber-500/20 bg-amber-500/[0.04]",
        badge: "bg-amber-500/10 text-amber-300",
      };
    default:
      return {
        frame: "border-border/70 bg-[#171b20]",
        header: "border-b border-border/50 bg-[#1d2228]",
        icon: "text-primary",
        panel: "border-border/60 bg-[#1f242b]",
        badge: "bg-primary/10 text-primary",
      };
  }
}

function LinkLogo({
  data,
  size,
  fallbackColor,
}: {
  data: Record<string, string | boolean | number>;
  size: number;
  fallbackColor: string;
}) {
  if (data.logoPreset) {
    const preset = getLogoPreset(String(data.logoPreset));
    if (preset?.logoUrl) {
      return <img src={preset.logoUrl} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />;
    }

    return <SocialIcon platform={String(data.logoPreset)} size={size} color={fallbackColor} />;
  }

  if (data.logoUrl) {
    return <img src={String(data.logoUrl)} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }

  return null;
}

function LinkSecondaryLogo({ data, size }: { data: Record<string, string | boolean | number>; size: number }) {
  if (!data.logoUrlSecondary) return null;
  return <img src={String(data.logoUrlSecondary)} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />;
}

function ImageUploadHint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-background/55 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
        <Info className="h-3 w-3" />
      </span>
      <span>{text}</span>
    </div>
  );
}

function BlockEditor({
  block,
  expanded,
  onChange,
  onDelete,
  onToggle,
  onToggleExpanded,
  onMoveUp,
  onMoveDown,
  onTouchDragStart,
  canMoveUp,
  canMoveDown,
}: {
  block: LocalBlock;
  expanded: boolean;
  onChange: (data: Record<string, string | boolean | number>) => void;
  onDelete: () => void;
  onToggle: () => void;
  onToggleExpanded: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onTouchDragStart: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const Icon = BLOCK_ICONS[block.type];
  const linkAlign = block.type === "link" ? getLinkAlignment(block.data) : "center";
  const selectedCommercePreset = block.type === "link" ? getCommercePreset(String(block.data.logoPreset || "")) : undefined;
  const inlineSocialAccounts = block.type === "social" && getSocialPlacement(block.data) !== "top" ? getInlineSocialAccounts(block.data) : [];
  const firstInlineSocialAccount = inlineSocialAccounts.find((account) => account.platform) ?? inlineSocialAccounts[0];
  const selectedSocialPlatform = block.type === "social"
    ? SOCIAL_PLATFORMS.find(item => item.id === (firstInlineSocialAccount?.platform || block.data.platform))
    : undefined;
  const isCommerceLink = block.type === "link" && Boolean(selectedCommercePreset);
  const tone = getBlockTone(block);
  const blockLabel = getBlockLabel(block);
  const showLinkVisual = block.type === "link" && Boolean(block.data.logoUrl || block.data.logoPreset || block.data.logoUrlSecondary);
  const showSocialVisual = block.type === "social" && Boolean(firstInlineSocialAccount?.platform || block.data.platform);

  const handleImageUpload = (file?: File) => {
    if (!file) return;
    readImageFile(file, (dataUrl) => onChange({ ...block.data, url: dataUrl }), "Profil resmi");
  };

  const handleCommercePresetChange = (presetId: string) => {
    const nextPreset = getCommercePreset(presetId);
    if (!nextPreset) return;

    const nextData: Record<string, string | boolean | number> = {
      ...block.data,
      logoPreset: nextPreset.id,
      title: nextPreset.label,
    };
    delete nextData.logoUrl;
    onChange(nextData);
  };

  const rememberTextSelection = (element: HTMLInputElement | HTMLTextAreaElement) => {
    onChange({
      ...block.data,
      selectionStart: element.selectionStart ?? 0,
      selectionEnd: element.selectionEnd ?? 0,
    });
  };

  const applySelectedTextLink = () => {
    const text = String(block.data.text || "");
    const start = Number(block.data.selectionStart ?? 0);
    const end = Number(block.data.selectionEnd ?? 0);
    const url = String(block.data.pendingTextLinkUrl || "").trim();
    if (!url || Number.isNaN(start) || Number.isNaN(end) || end <= start || end > text.length) {
      toast.error("Once metinden bir bolum secip link URL'si girin");
      return;
    }
    onChange({
      ...block.data,
      textLinkStart: start,
      textLinkEnd: end,
      textLinkUrl: url,
      pendingTextLinkUrl: "",
    });
  };

  const clearSelectedTextLink = () => {
    const nextData = { ...block.data };
    delete nextData.textLinkStart;
    delete nextData.textLinkEnd;
    delete nextData.textLinkUrl;
    onChange(nextData);
  };

  const renderTextStyleControls = () => (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <Select value={String(block.data.textStyle || "normal")} onValueChange={(value) => onChange({ ...block.data, textStyle: value })}>
          <SelectTrigger className="bg-input border-border/60 text-sm">
            <SelectValue placeholder="Yazi stili" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="bold">Kalin</SelectItem>
            <SelectItem value="light">Ince</SelectItem>
            <SelectItem value="display">Buyuk baslik</SelectItem>
            <SelectItem value="small">Kucuk metin</SelectItem>
            <SelectItem value="accent">Vurgu metni</SelectItem>
          </SelectContent>
        </Select>
        <ToggleGroup
          type="single"
          value={String(block.data.align || "center")}
          onValueChange={(value) => value && onChange({ ...block.data, align: value })}
          className="grid w-full grid-cols-3"
        >
          <ToggleGroupItem value="left" className="text-[10px]">Sol</ToggleGroupItem>
          <ToggleGroupItem value="center" className="text-[10px]">Orta</ToggleGroupItem>
          <ToggleGroupItem value="right" className="text-[10px]">Sag</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-input px-2">
          <input
            type="color"
            value={normalizeColorInput(String(block.data.textColor || ""), "#ffffff")}
            onChange={(event) => onChange({ ...block.data, textColor: event.target.value })}
            className="h-8 w-8 rounded border-0 bg-transparent p-0"
          />
          <Input
            value={String(block.data.textColor || "")}
            onChange={(event) => onChange({ ...block.data, textColor: event.target.value })}
            placeholder="Yazi rengi #FFFFFF"
            className="border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="flex gap-2">
          <Input
            value={String(block.data.pendingTextLinkUrl || "")}
            onChange={(event) => onChange({ ...block.data, pendingTextLinkUrl: event.target.value })}
            placeholder="Secili metin linki"
            className="bg-input border-border/60 text-sm"
          />
          <Button type="button" variant="outline" onClick={applySelectedTextLink} className="shrink-0 border-border/60">
            <Link className="mr-1.5 h-3.5 w-3.5" />
            Link
          </Button>
        </div>
      </div>
      {block.data.textLinkUrl ? (
        <Button type="button" variant="ghost" size="sm" onClick={clearSelectedTextLink} className="h-8 px-2 text-xs text-muted-foreground">
          Metin linkini kaldir
        </Button>
      ) : null}
    </div>
  );

  const updateInlineSocialAccounts = (accounts: SocialAccountData[]) => {
    onChange(withInlineSocialAccounts(block.data, accounts));
  };

  const addInlineSocialAccount = () => {
    updateInlineSocialAccounts([
      ...inlineSocialAccounts,
      {
        id: makeSocialAccountId(),
        platform: "",
        url: "",
        isEnabled: true,
      },
    ]);
  };

  const updateInlineSocialAccount = (id: string, patch: Partial<SocialAccountData>) => {
    updateInlineSocialAccounts(
      inlineSocialAccounts.map((account) =>
        account.id === id
          ? {
              ...account,
              ...patch,
              url: patch.url !== undefined
                ? normalizeSocialUrl(patch.platform ?? account.platform, patch.url)
                : account.url,
            }
          : account,
      ),
    );
  };

  const removeInlineSocialAccount = (id: string) => {
    updateInlineSocialAccounts(inlineSocialAccounts.filter((account) => account.id !== id));
  };

  return (
    <div className={`min-w-0 overflow-hidden rounded-[1.15rem] border shadow-sm transition-all ${block.isEnabled ? tone.frame : "border-border/40 bg-[#1a1e24] opacity-70"}`}>
      <div onClick={onToggleExpanded} className={`flex cursor-pointer flex-wrap items-start gap-3 px-3 py-3 sm:flex-nowrap sm:items-center sm:px-3.5 sm:py-3.5 ${block.isEnabled ? tone.header : "border-b border-border/30 bg-[#181c21]"}`}>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          onTouchStart={(event) => {
            event.preventDefault();
            onTouchDragStart();
          }}
          className="mt-0.5 rounded p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          aria-label="Surukleyerek sirala"
        >
          <GripVertical className="h-4 w-4 cursor-grab flex-shrink-0" />
        </button>
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 ${block.isEnabled ? tone.badge : "bg-muted/40 text-muted-foreground"}`}>
            {showLinkVisual ? (
              <div className="relative h-7 w-7">
                <div className="absolute inset-0 flex items-center justify-center">
                  <LinkLogo data={block.data} size={28} fallbackColor={selectedCommercePreset?.color || "#FFFFFF"} />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-black/30 bg-[#111418]">
                  <Link className="h-2.5 w-2.5 text-primary" />
                </div>
              </div>
            ) : showSocialVisual ? (
              <div className="relative h-7 w-7">
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/15">
                  <SocialIcon platform={String(firstInlineSocialAccount?.platform || block.data.platform || "")} size={18} color={selectedSocialPlatform?.color || "#D6FF00"} />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-black/30 bg-[#111418]">
                  <Share2 className="h-2.5 w-2.5 text-primary" />
                </div>
              </div>
            ) : (
              <Icon className={`h-4 w-4 ${block.isEnabled ? tone.icon : "text-muted-foreground"}`} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="min-w-0 truncate text-sm font-medium">{blockLabel}</span>
              {(block.type === "link" || block.type === "social") && (
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground sm:text-[11px]">
                  {block.clicks ?? 0} tiklama
                </span>
              )}
            </div>
            <p className="mt-0.5 line-clamp-2 break-all text-[11px] leading-snug text-muted-foreground sm:truncate">{getBlockSummary(block)}</p>
          </div>
        </div>

        <div className="flex w-full flex-shrink-0 items-center justify-between gap-1 rounded-xl border border-border/40 bg-background/45 px-2 py-1.5 sm:w-auto sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onMoveUp();
            }}
            disabled={!canMoveUp}
            className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
            aria-label="Blogu yukari tasi"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onMoveDown();
            }}
            disabled={!canMoveDown}
            className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
            aria-label="Blogu asagi tasi"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <div onClick={(event) => event.stopPropagation()}>
            <Switch checked={block.isEnabled} onCheckedChange={onToggle} className="scale-75" />
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleExpanded();
            }}
            className="p-1 rounded text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-border/40 px-3 pb-3 pt-3 sm:px-3.5 sm:pb-3.5 sm:pt-3.5">
          {block.type === "heading" && (
            <div className="space-y-2">
              <Input
                value={String(block.data.text || "")}
                onChange={(event) => onChange({ ...block.data, text: event.target.value })}
                onSelect={(event) => rememberTextSelection(event.currentTarget)}
                placeholder="Baslik metni..."
                className="bg-input border-border/50 text-sm"
              />
              {renderTextStyleControls()}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/55 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">Basligi buyuk harf goster</p>
                <Switch
                  checked={Boolean(block.data.uppercase)}
                  onCheckedChange={(checked) => onChange({ ...block.data, uppercase: checked })}
                  className="scale-75"
                />
              </div>
            </div>
          )}

          {block.type === "description" && (
            <div className="space-y-2">
              <Textarea
                value={String(block.data.text || "")}
                onChange={(event) => onChange({ ...block.data, text: event.target.value })}
                onSelect={(event) => rememberTextSelection(event.currentTarget)}
                placeholder="Aciklama metni..."
                className="bg-input border-border/50 text-sm resize-none"
                rows={2}
              />
              {renderTextStyleControls()}
            </div>
          )}

          {block.type === "text" && (
            <div className="space-y-2">
              <Textarea
                value={String(block.data.text || "")}
                onChange={(event) => onChange({ ...block.data, text: event.target.value })}
                onSelect={(event) => rememberTextSelection(event.currentTarget)}
                placeholder="Metin icerigi..."
                className="bg-input border-border/50 text-sm resize-none"
                rows={3}
              />
              {renderTextStyleControls()}
            </div>
          )}

          {block.type === "link" && (
            <div className="space-y-3">
              <div className={`rounded-xl border p-3 shadow-sm ${tone.panel}`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium">Yazi hizasi</p>
                  <span className="text-[10px] text-muted-foreground">Varsayilan: ortali</span>
                </div>
                <ToggleGroup
                  type="single"
                  value={linkAlign}
                  onValueChange={(value) => {
                    if (!value) return;
                    onChange({ ...block.data, align: value });
                  }}
                  variant="outline"
                  className="grid w-full grid-cols-2"
                >
                  <ToggleGroupItem value="center" className="gap-1.5 text-[10px] sm:text-[11px]">
                    <AlignCenter className="h-3.5 w-3.5" />
                    Ortali
                  </ToggleGroupItem>
                  <ToggleGroupItem value="left" className="gap-1.5 text-[10px] sm:text-[11px]">
                    <AlignLeft className="h-3.5 w-3.5" />
                    Soldan
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {isCommerceLink && (
                <div className={`space-y-2 rounded-xl border p-3 shadow-sm ${tone.panel}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium">E-ticaret sitesi</p>
                    <span className="text-[10px] text-muted-foreground">Isterseniz sonra degistirebilirsiniz</span>
                  </div>
                  <Select value={selectedCommercePreset?.id || ""} onValueChange={handleCommercePresetChange}>
                    <SelectTrigger className="h-11 bg-input border-border/70 text-sm">
                      {selectedCommercePreset ? (
                        <div className="flex min-w-0 items-center gap-2">
                          <img src={selectedCommercePreset.logoUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                          <span className="truncate">{selectedCommercePreset.label}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Magaza secin...</span>
                      )}
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border/50">
                      {COMMERCE_LINK_PRESETS.map((preset) => (
                        <SelectItem key={preset.id} value={preset.id} className="text-sm">
                          <div className="flex items-center gap-2">
                            <img src={preset.logoUrl} alt="" className="h-[18px] w-[18px] rounded-full object-cover" />
                            <span>{preset.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className={`space-y-2 rounded-xl border p-3 shadow-sm ${tone.panel}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium">{isCommerceLink ? "Magaza bilgileri" : "Link icerigi"}</p>
                  <span className="text-[10px] text-muted-foreground">Tek satir gorunur</span>
                </div>
                <Input
                  value={String(block.data.title || "")}
                  onChange={(event) => onChange({ ...block.data, title: event.target.value })}
                  placeholder={isCommerceLink ? "Magaza adi" : "Baslik"}
                  className={`bg-input border-border/60 text-sm ${linkAlign === "center" ? "text-center" : "text-left"}`}
                />
                <Input
                  value={String(block.data.url || "")}
                  onChange={(event) => onChange({ ...block.data, url: event.target.value })}
                  placeholder={selectedCommercePreset?.placeholder || "https://..."}
                  className="bg-input border-border/60 text-sm"
                />
              </div>

              <div className={`space-y-3 rounded-xl border p-3 shadow-sm ${tone.panel}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium">Kart gorunumu</p>
                  <span className="text-[10px] text-muted-foreground">Onizleme aninda guncellenir</span>
                </div>
                <Select
                  value={LINK_STYLE_TEMPLATES.find((template) => isTemplateActive(block.data, template.patch))?.id || "clean"}
                  onValueChange={(value) => {
                    const selectedTemplate = LINK_STYLE_TEMPLATES.find((template) => template.id === value);
                    if (selectedTemplate) {
                      onChange({ ...block.data, ...selectedTemplate.patch });
                    }
                  }}
                >
                  <SelectTrigger className="bg-input border-border/60 text-sm">
                    <SelectValue placeholder="Hazir kart stili" />
                  </SelectTrigger>
                  <SelectContent>
                    {LINK_STYLE_TEMPLATES.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-input px-2">
                    <input
                      type="color"
                      value={normalizeColorInput(String(block.data.textColor || ""), "#ffffff")}
                      onChange={(event) => onChange({ ...block.data, textColor: event.target.value })}
                      className="h-8 w-8 rounded border-0 bg-transparent p-0"
                    />
                    <Input
                      value={String(block.data.textColor || "")}
                      onChange={(event) => onChange({ ...block.data, textColor: event.target.value })}
                      placeholder="Metin rengi  #FFFFFF"
                      className="border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-input px-2">
                    <input
                      type="color"
                      value={normalizeColorInput(String(block.data.bgColor || ""), "#1f2329")}
                      onChange={(event) => onChange({ ...block.data, bgColor: event.target.value })}
                      className="h-8 w-8 rounded border-0 bg-transparent p-0"
                    />
                    <Input
                      value={String(block.data.bgColor || "")}
                      onChange={(event) => onChange({ ...block.data, bgColor: event.target.value })}
                      placeholder="Arka plan rengi  #1F2329"
                      className="border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-input px-2">
                    <input
                      type="color"
                      value={normalizeColorInput(String(block.data.borderColor || ""), "#d6ff00")}
                      onChange={(event) => onChange({ ...block.data, borderColor: event.target.value })}
                      className="h-8 w-8 rounded border-0 bg-transparent p-0"
                    />
                    <Input
                      value={String(block.data.borderColor || "")}
                      onChange={(event) => onChange({ ...block.data, borderColor: event.target.value })}
                      placeholder="Kenar rengi  #D6FF00"
                      className="border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <Select value={String(block.data.borderWidth || 1)} onValueChange={(value) => onChange({ ...block.data, borderWidth: Number(value) })}>
                    <SelectTrigger className="bg-input border-border/60 text-sm">
                      <SelectValue placeholder="Kenar kalinligi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Kenar yok</SelectItem>
                      <SelectItem value="1">1 px</SelectItem>
                      <SelectItem value="2">2 px</SelectItem>
                      <SelectItem value="3">3 px</SelectItem>
                    </SelectContent>
                  </Select>
                  <ToggleGroup
                    type="single"
                    value={String(block.data.radiusPreset || "soft")}
                    onValueChange={(value) => value && onChange({ ...block.data, radiusPreset: value })}
                    className="grid w-full grid-cols-3"
                  >
                    <ToggleGroupItem value="square" className="text-[10px]">Keskin</ToggleGroupItem>
                    <ToggleGroupItem value="soft" className="text-[10px]">Yumusak</ToggleGroupItem>
                    <ToggleGroupItem value="pill" className="text-[10px]">Tam</ToggleGroupItem>
                  </ToggleGroup>
                  <Select value={String(block.data.fontPreset || "clean")} onValueChange={(value) => onChange({ ...block.data, fontPreset: value })}>
                    <SelectTrigger className="bg-input border-border/60 text-sm">
                      <SelectValue placeholder="Yazi formati" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clean">Temiz</SelectItem>
                      <SelectItem value="bold">Kalin</SelectItem>
                      <SelectItem value="caps">Buyuk harf</SelectItem>
                      <SelectItem value="wide">Genis</SelectItem>
                      <SelectItem value="compact">Kompakt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className={`space-y-2 rounded-xl border p-3 shadow-sm ${tone.panel}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  {block.data.logoUrl || block.data.logoPreset || block.data.logoUrlSecondary ? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-background/80">
                      <div className="relative h-8 w-8">
                        <div className="absolute left-0 top-0">
                          <LinkLogo data={block.data} size={32} fallbackColor={selectedCommercePreset?.color || "#FFFFFF"} />
                        </div>
                        {block.data.logoUrlSecondary && (
                          <div className="absolute -bottom-1 -right-1 rounded-full border border-border/70 bg-background/90 p-[1px]">
                            <LinkSecondaryLogo data={block.data} size={14} />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-border/60">
                      <Image className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{isCommerceLink ? "Magaza logosu" : "Link logosu"}</p>
                    {isCommerceLink ? (
                      <p className="text-[11px] text-muted-foreground">
                        Hazir e-ticaret seciminde logo otomatik gelir. Bu blokta ayrica logo degistirmeniz gerekmez.
                      </p>
                    ) : (
                      <ImageUploadHint text="Link logosu icin onerilen boyut 512 x 512 px, oran 1:1 kare. Yuvarlak alana tam oturmasi icin PNG/JPG kullanin. Maksimum 7 MB." />
                    )}
                  </div>
                </div>
                <>
                  {!isCommerceLink && (
                    <>
                      <Input
                        value={String(block.data.logoUrl || "")}
                        onChange={(event) => onChange({ ...block.data, logoUrl: event.target.value })}
                        placeholder="Ana logo URL'si (opsiyonel)"
                        className="bg-input border-border/60 text-sm"
                      />
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          if (file) {
                            readImageFile(file, (dataUrl) => onChange({ ...block.data, logoUrl: dataUrl }), "Logo");
                          }
                          event.currentTarget.value = "";
                        }}
                        className="bg-input border-border/60 text-sm"
                      />
                      {block.data.logoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const nextData = { ...block.data };
                            delete nextData.logoUrl;
                            onChange(nextData);
                          }}
                          className="h-8 px-2 text-xs text-muted-foreground"
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Logoyu kaldir
                        </Button>
                      )}
                    </>
                  )}

                  <Input
                    value={String(block.data.logoUrlSecondary || "")}
                    onChange={(event) => onChange({ ...block.data, logoUrlSecondary: event.target.value })}
                    placeholder={isCommerceLink ? "Ek logo URL'si (marka logonuz) (opsiyonel)" : "Ek logo URL'si (opsiyonel)"}
                    className="bg-input border-border/60 text-sm"
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      if (file) {
                        readImageFile(file, (dataUrl) => onChange({ ...block.data, logoUrlSecondary: dataUrl }), "Ek logo");
                      }
                      event.currentTarget.value = "";
                    }}
                    className="bg-input border-border/60 text-sm"
                  />
                  {block.data.logoUrlSecondary && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const nextData = { ...block.data };
                        delete nextData.logoUrlSecondary;
                        onChange(nextData);
                      }}
                      className="h-8 px-2 text-xs text-muted-foreground"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Ek logoyu kaldir
                    </Button>
                  )}
                </>
              </div>
            </div>
          )}

          {block.type === "social" && (
            <div className="space-y-3">
              {getSocialPlacement(block.data) === "top" ? (
                <>
                  <div className="rounded-xl border border-border/70 bg-background/55 p-3 shadow-sm">
                    <div className="mb-2">
                      <p className="text-xs font-medium">Platform secimi</p>
                      <p className="text-[11px] text-muted-foreground">Bu hesap ust profil sosyal ikon alaninda gorunur.</p>
                    </div>
                    <Select
                      value={String(block.data.platform || "")}
                      onValueChange={(value) => onChange({ ...block.data, placement: "top", platform: value, url: normalizeSocialUrl(value, String(block.data.url || "")) })}
                    >
                      <SelectTrigger className="h-11 bg-input border-border/70 text-sm">
                        {selectedSocialPlatform ? (
                          <div className="flex min-w-0 items-center gap-2">
                            <SocialIcon platform={selectedSocialPlatform.id} size={18} color={selectedSocialPlatform.color} />
                            <span className="truncate">{selectedSocialPlatform.label}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Platform secin...</span>
                        )}
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border/50">
                        {SOCIAL_PLATFORMS.map(platform => (
                          <SelectItem key={platform.id} value={platform.id} className="text-sm">
                            <div className="flex items-center gap-2">
                              <SocialIcon platform={platform.id} size={18} color={platform.color} />
                              <span>{platform.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 rounded-xl border border-border/70 bg-background/55 p-3 shadow-sm">
                    <p className="text-xs font-medium">Baglanti</p>
                    <Input
                      value={String(block.data.url || "")}
                      onChange={(event) => onChange({ ...block.data, placement: "top", url: normalizeSocialUrl(String(block.data.platform || ""), event.target.value) })}
                      placeholder={SOCIAL_PLATFORMS.find(platform => platform.id === block.data.platform)?.placeholder || "https://..."}
                      className="bg-input border-border/60 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Ust profil ikonlari sadece profil alaninda gorunur.</p>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-border/70 bg-background/55 p-3 shadow-sm">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold">Sayfa ici sosyal medya blogu</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Bu tek kartin icine istediginiz kadar sosyal hesap ekleyin. Blok listede tasindigi yerde gorunur.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        addInlineSocialAccount();
                      }}
                      className="h-9 bg-primary text-primary-foreground"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Yeni sosyal medya hesabi ekle
                    </Button>
                  </div>

                  {inlineSocialAccounts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/60 bg-card/45 px-3 py-6 text-center">
                      <p className="text-sm font-medium">Henuz hesap eklenmedi</p>
                      <p className="mt-1 text-xs text-muted-foreground">Butona basarak Instagram, TikTok, YouTube ve diger hesaplari ekleyin.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {inlineSocialAccounts.map((account, accountIndex) => {
                        const accountPlatform = SOCIAL_PLATFORMS.find((platform) => platform.id === account.platform);
                        return (
                          <div key={account.id} className="rounded-xl border border-border/60 bg-card/70 p-3">
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/70">
                                  <SocialIcon platform={account.platform} size={18} color={accountPlatform?.color || "#D6FF00"} />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">{accountPlatform?.label || `Sosyal hesap ${accountIndex + 1}`}</p>
                                  <p className="truncate text-[11px] text-muted-foreground">{account.url || "Baglanti bekleniyor"}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Switch
                                  checked={account.isEnabled !== false}
                                  onCheckedChange={(checked) => updateInlineSocialAccount(account.id, { isEnabled: checked })}
                                  className="scale-75"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeInlineSocialAccount(account.id)}
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid gap-2 md:grid-cols-[220px_minmax(0,1fr)]">
                              <Select
                                value={account.platform}
                                onValueChange={(value) => updateInlineSocialAccount(account.id, {
                                  platform: value,
                                  url: normalizeSocialUrl(value, account.url),
                                })}
                              >
                                <SelectTrigger className="h-11 bg-input border-border/70 text-sm">
                                  {accountPlatform ? (
                                    <div className="flex min-w-0 items-center gap-2">
                                      <SocialIcon platform={accountPlatform.id} size={18} color={accountPlatform.color} />
                                      <span className="truncate">{accountPlatform.label}</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">Platform secin...</span>
                                  )}
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border/50">
                                  {SOCIAL_PLATFORMS.map(platform => (
                                    <SelectItem key={platform.id} value={platform.id} className="text-sm">
                                      <div className="flex items-center gap-2">
                                        <SocialIcon platform={platform.id} size={18} color={platform.color} />
                                        <span>{platform.label}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                value={account.url}
                                onChange={(event) => updateInlineSocialAccount(account.id, { url: event.target.value })}
                                placeholder={accountPlatform?.placeholder || "https://..."}
                                className="bg-input border-border/60 text-sm"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {block.type === "divider" && (
            <div className="space-y-2 rounded-xl border border-border/70 bg-background/55 p-3 shadow-sm">
              <p className="text-xs font-medium">Cizgi Kalinligi</p>
              <ToggleGroup
                type="single"
                value={getDividerVariant(block.data)}
                onValueChange={(value) => {
                  if (!value) return;
                  onChange({ ...block.data, variant: value });
                }}
                variant="outline"
                className="grid w-full grid-cols-2"
              >
                <ToggleGroupItem value="thin" className="gap-1.5 text-[11px]">
                  Ince Cizgi
                </ToggleGroupItem>
                <ToggleGroupItem value="thick" className="gap-1.5 text-[11px]">
                  Kalin Cizgi
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}

          {block.type === "profile_image" && (
            <div className="space-y-2">
              {block.data.url && (
                <div className="flex justify-center">
                  <img src={String(block.data.url)} alt="Profil resmi" className="h-20 w-20 rounded-full object-cover border border-border/50" />
                </div>
              )}
              <Input
                value={String(block.data.url || "")}
                onChange={(event) => onChange({ ...block.data, url: event.target.value })}
                placeholder="Profil resmi URL'si"
                className="bg-input border-border/50 text-sm"
              />
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  handleImageUpload(event.currentTarget.files?.[0]);
                  event.currentTarget.value = "";
                }}
                className="bg-input border-border/50 text-sm"
              />
              <p className="text-xs text-muted-foreground">JPG, PNG veya WebP yukleyebilirsiniz. Ust sinir 5 MB.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PreviewCardContents({
  blocks,
  page,
  accentColor,
  textColor,
  theme,
  mode,
}: {
  blocks: LocalBlock[];
  page: { title: string; description?: string | null; profileImageUrl?: string | null; slug: string; customBackgroundImageUrl?: string | null };
  accentColor: string;
  textColor: string;
  theme: string;
  mode: "phone" | "desktop";
}) {
  const themeConfig = withCustomBackgroundImage(getBioTheme(theme), page.customBackgroundImageUrl);
  const accent = safeAccentColor(accentColor, themeConfig.accent);
  const resolvedTextColor = /^#[0-9a-fA-F]{6}$/.test(textColor) ? textColor : themeConfig.text;
  const enabledBlocks = blocks.filter(block => block.isEnabled);
  const contentBlocks = enabledBlocks.filter(block => block.type !== "social" || getSocialPlacement(block.data) !== "top");
  const topSocialBlocks = enabledBlocks.filter(block => block.type === "social" && block.data.url && getSocialPlacement(block.data) === "top");
  const buttonStyle = getBioButtonStyle(themeConfig, accent, resolvedTextColor);
  const isDesktop = mode === "desktop";
  const iconSize = isDesktop ? 30 : 24;

  const getSocialColor = (block: LocalBlock) => {
    const platform = SOCIAL_PLATFORMS.find(item => item.id === block.data.platform);
    return platform?.color || accent;
  };

  const renderBlock = (block: LocalBlock) => {
    if (block.type === "divider") {
      const dividerVariant = getDividerVariant(block.data);
      return (
        <hr
          key={block.tempId}
          className={isDesktop ? "my-3 border-t" : "my-2 border-t"}
          style={{
            borderColor: themeConfig.cardBorder,
            borderTopWidth: dividerVariant === "thick" ? "4px" : "1px",
            opacity: dividerVariant === "thick" ? 0.95 : 0.7,
          }}
        />
      );
    }

    if (block.type === "heading") {
      const text = String(block.data.text || "Baslik");
      const blockTextColor = String(block.data.textColor || resolvedTextColor);
      return (
          <p
            key={block.tempId}
            className={`line-clamp-2 max-w-full overflow-hidden break-words py-1 [overflow-wrap:anywhere] ${getTextAlignClass(block.data.align)} ${isDesktop ? "text-lg" : "text-sm"}`}
            style={{ color: blockTextColor, textTransform: block.data.uppercase ? "uppercase" : "none", ...getTextStyleInline(block.data.textStyle) }}
          >
          <RichText text={block.data.uppercase ? text.toUpperCase() : text} data={block.data} linkColor={blockTextColor} />
        </p>
      );
    }

    if (block.type === "description" || block.type === "text") {
      const blockTextColor = String(block.data.textColor || resolvedTextColor);
      return (
        <p key={block.tempId} className={`line-clamp-3 max-w-full overflow-hidden break-words px-2 leading-relaxed [overflow-wrap:anywhere] ${getTextAlignClass(block.data.align)} ${isDesktop ? "text-sm" : "text-xs"}`} style={{ color: blockTextColor, ...getTextStyleInline(block.data.textStyle) }}>
          <RichText text={String(block.data.text || "Metin...")} data={block.data} linkColor={blockTextColor} />
        </p>
      );
    }

    if (block.type === "link") {
      const align = getLinkAlignment(block.data);
      const logo = <LinkLogo data={block.data} size={iconSize} fallbackColor={accent} />;
      const secondaryLogo = <LinkSecondaryLogo data={block.data} size={Math.max(12, Math.floor(iconSize * 0.52))} />;
      const linkStyle = {
        ...buttonStyle,
        color: String(block.data.textColor || resolvedTextColor),
        background: String(block.data.bgColor || (buttonStyle.background as string)),
        borderColor: String(block.data.borderColor || (buttonStyle.borderColor as string)),
        borderWidth: `${Number(block.data.borderWidth ?? 1)}px`,
        borderRadius: getRadiusValue(block.data.radiusPreset),
      } as React.CSSProperties;
      const fontPresetClass = getFontPresetClass(block.data.fontPreset);

      return (
        <div
          key={block.tempId}
          className={`link-card link-button mx-auto grid w-full content-center place-items-center overflow-visible rounded-xl border transition-all ${isDesktop ? "min-h-[5.1rem] px-5 py-2" : "min-h-[4.1rem] max-w-[28rem] px-4 py-2"}`}
          style={linkStyle}
        >
          <div className="relative grid h-full w-full place-items-center self-stretch">
            <div className={`absolute left-0 top-1/2 grid -translate-y-1/2 place-items-center rounded-full ${isDesktop ? "h-8 w-8" : "h-7 w-7"}`}>
              {logo || secondaryLogo ? (
                <div className={`relative ${isDesktop ? "h-8 w-8" : "h-7 w-7"}`}>
                  <div className="absolute left-0 top-0">{logo}</div>
                  {block.data.logoUrlSecondary && (
                    <div className="absolute -bottom-1 -right-1 rounded-full border border-border/70 bg-background/90 p-[1px]">
                      {secondaryLogo}
                    </div>
                  )}
                </div>
              ) : (
                <span className={`${isDesktop ? "h-8 w-8" : "h-7 w-7"} rounded-full`} />
              )}
            </div>
            <span className={`link-title flex min-h-full w-full min-w-0 items-center justify-center overflow-hidden truncate text-center ${fontPresetClass} ${isDesktop ? "px-10 text-[15px]" : "px-8 text-xs"} ${align === "left" ? "sm:justify-start sm:text-left" : ""}`} style={{ color: String(block.data.textColor || resolvedTextColor) }}>
              {String(block.data.title || "Link")}
            </span>
            <ExternalLink className={`${isDesktop ? "h-4 w-4" : "h-3 w-3"} absolute right-0 top-1/2 -translate-y-1/2 opacity-55`} style={{ color: String(block.data.textColor || resolvedTextColor) }} />
          </div>
        </div>
      );
    }

    if (block.type === "social" && getSocialPlacement(block.data) !== "top") {
      const accounts = getInlineSocialAccounts(block.data).filter((account) => account.isEnabled !== false && account.platform);
      if (accounts.length === 0) return null;

      return (
        <div key={block.tempId} className={`flex flex-wrap justify-center ${isDesktop ? "gap-3 py-2" : "gap-2.5 py-1.5"}`}>
          {accounts.map((account) => {
            const platform = SOCIAL_PLATFORMS.find((item) => item.id === account.platform);
            return (
              <div
                key={account.id}
                className={`${isDesktop ? "h-11 w-11" : "h-10 w-10"} rounded-full border flex items-center justify-center`}
                style={{ background: themeConfig.cardBg, borderColor: themeConfig.cardBorder }}
              >
                <SocialIcon platform={account.platform} size={isDesktop ? 20 : 18} color={platform?.color || accent} />
              </div>
            );
          })}
        </div>
      );
    }

    if (block.type === "profile_image" && block.data.url) {
      return (
        <div key={block.tempId} className={isDesktop ? "py-3" : "py-2"}>
          <div className="flex justify-center">
            <img
              src={String(block.data.url)}
              alt="Logo"
              className={isDesktop ? "h-28 w-28" : "h-24 w-24"}
              style={{
                objectFit: "cover",
                borderRadius: "9999px",
                border: `2px solid ${themeConfig.cardBorder}`,
                background: themeConfig.cardBg,
              }}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`rounded-[1.95rem] border flex flex-col ${isDesktop ? "min-h-[620px] p-7" : "min-h-full p-4.5"}`} style={getBioCardStyle(themeConfig, resolvedTextColor)}>
      <div className={`flex flex-col items-center ${isDesktop ? "mb-4 mt-1 gap-3" : "mb-3 mt-1 gap-2"}`}>
        {page.profileImageUrl ? (
          isVideoMediaUrl(page.profileImageUrl) ? (
            <video
              src={page.profileImageUrl}
              className={`${isDesktop ? "h-20 w-20" : "h-16 w-16"} rounded-full object-cover border-2`}
              style={{ borderColor: `${accent}66` }}
              muted
              playsInline
              autoPlay
              loop
            />
          ) : (
            <img
              src={page.profileImageUrl}
              alt="Profil resmi"
              className={`${isDesktop ? "h-20 w-20" : "h-16 w-16"} rounded-full object-cover border-2`}
              style={{ borderColor: `${accent}66` }}
            />
          )
        ) : (
          <div
            className={`${isDesktop ? "h-20 w-20" : "h-16 w-16"} rounded-full border-2 flex items-center justify-center`}
            style={{ borderColor: `${accent}66`, background: `${accent}22` }}
          >
            <UserRound className={isDesktop ? "h-8 w-8" : "h-7 w-7"} style={{ color: accent }} />
          </div>
        )}
        <div className="text-center">
          <p className={`font-semibold ${isDesktop ? "text-xl" : "text-sm"}`} style={{ color: resolvedTextColor }}>
            {page.title || "@kullanici"}
          </p>
          {page.description && (
            <p className={`${isDesktop ? "mt-2 text-sm" : "mt-1 text-xs"}`} style={{ color: resolvedTextColor }}>
              {page.description}
            </p>
          )}
          {topSocialBlocks.length > 0 && (
            <div className={`mt-3 flex flex-wrap justify-center ${isDesktop ? "gap-3" : "gap-2.5"}`}>
              {topSocialBlocks.map(block => (
                <div
                  key={block.tempId}
                  className={`${isDesktop ? "h-11 w-11" : "h-10 w-10"} rounded-full border flex items-center justify-center`}
                  style={{ background: themeConfig.cardBg, borderColor: themeConfig.cardBorder }}
                >
                  <SocialIcon platform={String(block.data.platform || "")} size={isDesktop ? 20 : 18} color={getSocialColor(block)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`w-full flex-1 ${isDesktop ? "space-y-3.5" : "space-y-2.5"}`}>
        {contentBlocks.map(renderBlock)}
      </div>
    </div>
  );
}

function PhonePreview({
  blocks,
  page,
  accentColor,
  textColor,
  theme,
}: {
  blocks: LocalBlock[];
  page: { title: string; description?: string | null; profileImageUrl?: string | null; slug: string; customBackgroundImageUrl?: string | null };
  accentColor: string;
  textColor: string;
  theme: string;
}) {
  const themeConfig = withCustomBackgroundImage(getBioTheme(theme), page.customBackgroundImageUrl);
  const accent = safeAccentColor(accentColor, themeConfig.accent);

  return (
    <div className="flex h-full min-w-0 flex-col overflow-x-hidden">
      <div className="flex min-w-0 flex-1 flex-col items-center overflow-x-hidden">
        <div className="relative mx-auto aspect-[9/17.2] w-[min(100%,310px)] max-w-full overflow-hidden rounded-[2.15rem] border-2 border-black/70 bg-black shadow-2xl sm:w-[330px] lg:w-[340px]">
          <div className="absolute top-0 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-b-2xl bg-black" />
          <div
            className="h-full min-h-0 overflow-x-hidden overflow-y-auto px-3 pt-7 pb-4"
            style={getBioBackgroundStyleStatic(themeConfig, accent)}
          >
            <PreviewCardContents blocks={blocks} page={page} accentColor={accent} textColor={textColor} theme={theme} mode="phone" />
          </div>
        </div>
        <div className="mt-3 text-center">
          <p className="text-xs text-muted-foreground">Canli Onizleme</p>
          <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" className="mt-0.5 flex items-center justify-center gap-1 text-xs text-primary hover:underline">
            <Globe className="h-3 w-3" />
            llinktr.com/{page.slug}
          </a>
        </div>
        </div>
      </div>
  );
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

function getTextStyleInline(preset?: string | number | boolean): React.CSSProperties {
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

function getTextLinkParts(text: string, data: Record<string, string | boolean | number>) {
  const start = Number(data.textLinkStart);
  const end = Number(data.textLinkEnd);
  const url = String(data.textLinkUrl || "");
  if (!url || Number.isNaN(start) || Number.isNaN(end) || start < 0 || end <= start || end > text.length) {
    return null;
  }

  return {
    before: text.slice(0, start),
    linked: text.slice(start, end),
    after: text.slice(end),
    url,
  };
}

function RichText({
  text,
  data,
  linkColor,
}: {
  text: string;
  data: Record<string, string | boolean | number>;
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

function DesktopPreview({
  blocks,
  page,
  accentColor,
  textColor,
  theme,
}: {
  blocks: LocalBlock[];
  page: { title: string; description?: string | null; profileImageUrl?: string | null; slug: string; customBackgroundImageUrl?: string | null };
  accentColor: string;
  textColor: string;
  theme: string;
}) {
  const themeConfig = withCustomBackgroundImage(getBioTheme(theme), page.customBackgroundImageUrl);
  const accent = safeAccentColor(accentColor, themeConfig.accent);

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.8rem] border border-border/60 bg-card shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border/50 bg-background/75 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="hidden flex-1 justify-center md:flex">
            <div className="w-full max-w-[18rem] rounded-full border border-border/50 bg-background/80 px-4 py-1.5 text-center text-[11px] text-muted-foreground">
              https://llinktr.com/{page.slug}
            </div>
          </div>
          <div className="rounded-full border border-border/50 px-3 py-1 text-[11px] text-muted-foreground">
            Masaustu gorunumu
          </div>
        </div>
        <div className="min-h-[560px] overflow-y-auto p-4 md:p-6" style={getBioBackgroundStyle(themeConfig, accent)}>
          <div className="mx-auto w-full max-w-[38rem]">
            <PreviewCardContents blocks={blocks} page={page} accentColor={accent} textColor={textColor} theme={theme} mode="desktop" />
          </div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" className="mt-0.5 flex items-center justify-center gap-1 text-xs text-primary hover:underline">
          <Globe className="h-3 w-3" />
          llinktr.com/{page.slug}
        </a>
      </div>
    </div>
  );
}

export default function BioBuilder() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const pageId = parseInt(id || "0");
  const utils = trpc.useUtils();

  const { data: pageData, isLoading } = trpc.bioPages.getById.useQuery(
    { id: pageId },
    {
      enabled: isAuthenticated && !!pageId,
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    },
  );

  const [blocks, setBlocks] = useState<LocalBlock[]>([]);
  const [pageTitle, setPageTitle] = useState("");
  const [pageDesc, setPageDesc] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [theme, setTheme] = useState("dark_grid");
  const [accentColor, setAccentColor] = useState("#22D3EE");
  const [textColor, setTextColor] = useState("#F8FAFC");
  const [customBackgroundImageUrl, setCustomBackgroundImageUrl] = useState("");
  const [activeThemeCategory, setActiveThemeCategory] = useState<(typeof THEME_CATEGORY_TABS)[number]["id"]>("all");
  const [isPublished, setIsPublished] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isAddBlockDialogOpen, setIsAddBlockDialogOpen] = useState(false);
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const [isProfileMediaModalOpen, setIsProfileMediaModalOpen] = useState(false);
  const [isProfileTextModalOpen, setIsProfileTextModalOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [isSmartStartOpen, setIsSmartStartOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"phone" | "desktop">("phone");
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [touchDragActive, setTouchDragActive] = useState(false);
  const [expandedBlockIds, setExpandedBlockIds] = useState<Record<string, boolean>>({});
  const lastHydratedAtRef = useRef<Date | null>(null);
  const hydratedPageIdRef = useRef<number | null>(null);

  const themeConfig = withCustomBackgroundImage(getBioTheme(theme), customBackgroundImageUrl);
  const activeAccentColor = safeAccentColor(accentColor, themeConfig.accent);
  const visibleThemes = useMemo(
    () => BIO_THEMES.filter((item) => activeThemeCategory === "all" || getThemeCategory(item) === activeThemeCategory),
    [activeThemeCategory],
  );
  const totalClicks = useMemo(() => blocks.reduce((sum, block) => sum + (block.clicks ?? 0), 0), [blocks]);
  const activeBlockCount = useMemo(() => blocks.filter(block => block.isEnabled).length, [blocks]);
  const hiddenBlockCount = blocks.length - activeBlockCount;
  const actionBlockCount = useMemo(
    () => blocks.filter(block => block.type === "link" || block.type === "social").length,
    [blocks],
  );

  useEffect(() => {
    if (!pageData) return;
    if (hydratedPageIdRef.current === pageId) return;
    if (isDirty) {
      return;
    }

    const selectedTheme = getBioTheme(pageData.page.theme);
    setPageTitle(pageData.page.title);
    setPageDesc(pageData.page.description || "");
    setProfileImageUrl(pageData.page.profileImageUrl || "");
    setFaviconUrl(pageData.page.faviconUrl || "");
    setTheme(selectedTheme.id);
    setAccentColor(pageData.page.accentColor || selectedTheme.accent);
    setTextColor((pageData.page as { textColor?: string | null }).textColor || selectedTheme.defaultTextColor || selectedTheme.text);
    setCustomBackgroundImageUrl((pageData.page as { customBackgroundImageUrl?: string | null }).customBackgroundImageUrl || "");
    setActiveThemeCategory(((pageData.page as { themeCategory?: "all" | "solid" | "pattern" | "photo" | null }).themeCategory || "all"));
    setIsPublished(pageData.page.isPublished);
    const hydratedBlocks = normalizeBlocks(pageData.blocks.map(block => ({
      id: block.id,
      tempId: generateTempId(),
      type: block.type as BlockType,
      sortOrder: block.sortOrder,
      isEnabled: block.isEnabled,
      clicks: block.clicks ?? 0,
      data: (block.data as Record<string, string | boolean | number>) || {},
    })));
    setBlocks(hydratedBlocks);
    setExpandedBlockIds(
      Object.fromEntries(hydratedBlocks.map((block) => [block.tempId, false])),
    );
    lastHydratedAtRef.current = pageData.page.updatedAt;
    hydratedPageIdRef.current = pageId;
    setIsDirty(false);
  }, [pageData, isDirty, pageId]);

  const updatePageMutation = trpc.bioPages.update.useMutation({
    onSuccess: () => undefined,
    onError: (error) => toast.error(error.message),
  });

  const bulkSaveMutation = trpc.bioBlocks.bulkSave.useMutation({
    onSuccess: (savedBlocks) => {
      const nextBlocks = normalizeBlocks(savedBlocks.map(block => ({
        id: block.id,
        tempId: generateTempId(),
        type: block.type as BlockType,
        sortOrder: block.sortOrder,
        isEnabled: block.isEnabled,
        clicks: block.clicks ?? 0,
        data: (block.data as Record<string, string | boolean | number>) || {},
      })));
      setBlocks(nextBlocks);
      setExpandedBlockIds((prev) =>
        Object.fromEntries(nextBlocks.map((block) => [block.tempId, prev[block.tempId] ?? false])),
      );
      setIsDirty(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSave = async () => {
    try {
      const existingBlockCount = pageData?.blocks?.length ?? 0;
      const allowEmptyBlocks = blocks.length === 0 && existingBlockCount > 0;
      if (blocks.length === 0 && existingBlockCount > 0) {
        const confirmed = window.confirm(
          "Tum icerik bloklari silinecek. Bos olarak kaydetmek istediginize emin misiniz?",
        );
        if (!confirmed) return;
      }

      const pagePatch: {
        id: number;
        title: string;
        description: string | null;
        profileImageUrl?: string | null;
        faviconUrl?: string | null;
        theme: string;
        selectedThemeId: string;
        accentColor: string;
        textColor: string;
        customBackgroundImageUrl?: string | null;
        themeCategory: "solid" | "pattern" | "photo" | null;
        isPublished: boolean;
      } = {
        id: pageId,
        title: pageTitle,
        description: pageDesc || null,
        theme,
        selectedThemeId: theme,
        accentColor: activeAccentColor,
        textColor,
        themeCategory: activeThemeCategory === "all" ? null : activeThemeCategory,
        isPublished,
      };

      const savedPage = pageData?.page as
        | {
            profileImageUrl?: string | null;
            faviconUrl?: string | null;
            customBackgroundImageUrl?: string | null;
          }
        | undefined;

      if ((savedPage?.profileImageUrl || "") !== (profileImageUrl || "")) {
        pagePatch.profileImageUrl = profileImageUrl || null;
      }

      if ((savedPage?.faviconUrl || "") !== (faviconUrl || "")) {
        pagePatch.faviconUrl = faviconUrl || null;
      }

      if ((savedPage?.customBackgroundImageUrl || "") !== (customBackgroundImageUrl || "")) {
        pagePatch.customBackgroundImageUrl = customBackgroundImageUrl || null;
      }

      const pageHasChanges =
        !pageData?.page ||
        pageData.page.title !== pagePatch.title ||
        (pageData.page.description || null) !== pagePatch.description ||
        pageData.page.theme !== pagePatch.theme ||
        pageData.page.accentColor !== pagePatch.accentColor ||
        ((pageData.page as { textColor?: string | null }).textColor || "") !== pagePatch.textColor ||
        ((pageData.page as { themeCategory?: string | null }).themeCategory || null) !== pagePatch.themeCategory ||
        pageData.page.isPublished !== pagePatch.isPublished ||
        "profileImageUrl" in pagePatch ||
        "faviconUrl" in pagePatch ||
        "customBackgroundImageUrl" in pagePatch;

      const blocksPayload = blocks.map((block, index) => ({
        id: block.id,
        type: block.type,
        sortOrder: index,
        isEnabled: block.isEnabled,
        data: sanitizeBlockData(block.data),
      }));
      const savedBlocksPayload = (pageData?.blocks ?? []).map((block, index) => ({
        id: block.id,
        type: block.type,
        sortOrder: index,
        isEnabled: block.isEnabled,
        data: block.data || {},
      }));
      const blocksHaveChanges =
        !pageData?.blocks ||
        serializeBlocksForSave(blocksPayload) !== serializeBlocksForSave(savedBlocksPayload);

      if (!pageHasChanges && !blocksHaveChanges) {
        setIsDirty(false);
        toast.success("Kaydedildi");
        return;
      }

      const [, savedBlocks] = await Promise.all([
        pageHasChanges ? updatePageMutation.mutateAsync(pagePatch) : Promise.resolve({ success: true }),
        blocksHaveChanges
          ? bulkSaveMutation.mutateAsync({
              pageId,
              allowEmpty: allowEmptyBlocks,
              blocks: blocksPayload,
            })
          : Promise.resolve(pageData?.blocks ?? []),
      ]);

      if (pageData?.page) {
        const nextPage = {
          ...pageData.page,
          ...pagePatch,
          profileImageUrl: "profileImageUrl" in pagePatch ? pagePatch.profileImageUrl : pageData.page.profileImageUrl,
          faviconUrl: "faviconUrl" in pagePatch ? pagePatch.faviconUrl : pageData.page.faviconUrl,
          customBackgroundImageUrl: "customBackgroundImageUrl" in pagePatch
            ? pagePatch.customBackgroundImageUrl
            : (pageData.page as { customBackgroundImageUrl?: string | null }).customBackgroundImageUrl,
          updatedAt: new Date(),
        };

        utils.bioPages.getById.setData({ id: pageId }, { page: nextPage, blocks: savedBlocks });
        if (pageData.page.slug) {
          utils.bioPages.getBySlug.setData({ slug: pageData.page.slug }, { page: nextPage, blocks: savedBlocks, isPaused: !isPublished });
        }
      }

      void utils.bioPages.list.invalidate();
      setIsDirty(false);
      toast.success("Kaydedildi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kayit sirasinda bir hata olustu. Lutfen tekrar deneyin.");
    }
  };

  const addBlock = (type: BlockType, initialData?: Record<string, string | boolean | number>) => {
    if (blocks.length >= 50) {
      toast.error("Maksimum 50 oge sinirina ulastiniz");
      return;
    }

    const newBlock: LocalBlock = {
      tempId: generateTempId(),
      type,
      sortOrder: blocks.length,
      isEnabled: true,
      clicks: 0,
      data:
        type === "profile_image" && profileImageUrl
          ? { url: profileImageUrl }
          : type === "social"
            ? {
                placement: "inline",
                accounts: JSON.stringify([{ id: makeSocialAccountId(), platform: "", url: "", isEnabled: true }]),
                ...(initialData || {}),
              }
          : type === "link"
            ? { align: "center", ...(initialData || {}) }
            : type === "divider"
              ? { variant: "thin" }
              : initialData || {},
    };
    setBlocks(prev => normalizeBlocks([...prev, newBlock]));
    setExpandedBlockIds((prev) => ({ ...prev, [newBlock.tempId]: false }));
    setIsDirty(true);
    setIsAddBlockDialogOpen(false);
  };

  const toggleExpandedBlock = (tempId: string) => {
    setExpandedBlockIds((prev) => ({ ...prev, [tempId]: !prev[tempId] }));
  };

  const addSocialDraft = () => {
    addBlock("social", { placement: "top" });
  };

  const applySocialDrafts = (items: SocialLinkDraft[]) => {
    const socialByTempId = new Map(
      items.map((item) => [item.tempId ?? item.id, item]),
    );
    setBlocks((prev) =>
      normalizeBlocks(
        prev
          .filter((block) => block.type !== "social" || getSocialPlacement(block.data) !== "top" || socialByTempId.has(block.tempId))
          .map((block) => {
            if (block.type !== "social" || getSocialPlacement(block.data) !== "top") return block;
            const draft = socialByTempId.get(block.tempId);
            if (!draft) return block;
            return {
              ...block,
              isEnabled: draft.isEnabled,
              data: {
                ...block.data,
                placement: "top",
                platform: draft.platform,
                url: normalizeSocialUrl(draft.platform, draft.url),
              },
            };
          }),
      ),
    );
    setIsDirty(true);
  };

  const addCommerceBlock = (presetId: string) => {
    if (blocks.length >= 50) {
      toast.error("Maksimum 50 oge sinirina ulastiniz");
      return;
    }

    const preset = getCommercePreset(presetId);
    if (!preset) return;

    const newBlock: LocalBlock = {
      tempId: generateTempId(),
      type: "link",
      sortOrder: blocks.length,
      isEnabled: true,
      clicks: 0,
      data: {
        title: preset.label,
        url: "",
        logoPreset: preset.id,
        align: "center",
      },
    };

    setBlocks(prev => normalizeBlocks([...prev, newBlock]));
    setExpandedBlockIds((prev) => ({ ...prev, [newBlock.tempId]: false }));
    setIsDirty(true);
    setIsAddBlockDialogOpen(false);
  };

  const addLocationBlock = (presetId: string) => {
    if (blocks.length >= 50) {
      toast.error("Maksimum 50 oge sinirina ulastiniz");
      return;
    }

    const preset = getLocationPreset(presetId);
    if (!preset) return;

    const newBlock: LocalBlock = {
      tempId: generateTempId(),
      type: "link",
      sortOrder: blocks.length,
      isEnabled: true,
      clicks: 0,
      data: {
        title: preset.label,
        url: "",
        logoPreset: preset.platform,
        align: "center",
      },
    };

    setBlocks(prev => normalizeBlocks([...prev, newBlock]));
    setExpandedBlockIds((prev) => ({ ...prev, [newBlock.tempId]: false }));
    setIsDirty(true);
    setIsAddBlockDialogOpen(false);
  };

  const updateBlock = (tempId: string, data: Record<string, string | boolean | number>) => {
    setBlocks(prev => prev.map(block => block.tempId === tempId ? { ...block, data } : block));
    setIsDirty(true);
  };

  const deleteBlock = (tempId: string) => {
    setBlocks(prev => normalizeBlocks(prev.filter(block => block.tempId !== tempId)));
    setIsDirty(true);
  };

  const toggleBlock = (tempId: string) => {
    setBlocks(prev => prev.map(block => block.tempId === tempId ? { ...block, isEnabled: !block.isEnabled } : block));
    setIsDirty(true);
  };

  const moveBlock = (tempId: string, direction: "up" | "down") => {
    setBlocks(prev => {
      const index = prev.findIndex(block => block.tempId === tempId);
      if (index === -1) return prev;
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return normalizeBlocks(next);
    });
    setIsDirty(true);
  };

  const moveBlockTo = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setBlocks(prev => {
      const sourceIndex = prev.findIndex(block => block.tempId === sourceId);
      const targetIndex = prev.findIndex(block => block.tempId === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;
      const next = [...prev];
      const [source] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, source);
      return normalizeBlocks(next);
    });
    setIsDirty(true);
  };

  useEffect(() => {
    if (!touchDragActive || !draggingId) return;

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      event.preventDefault();

      const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
      const targetContainer = target?.closest("[data-block-id]") as HTMLElement | null;
      const targetId = targetContainer?.dataset.blockId;
      if (!targetId || targetId === draggingId) return;

      setDropTargetId(targetId);
      moveBlockTo(draggingId, targetId);
    };

    const handleTouchEnd = () => {
      setTouchDragActive(false);
      setDraggingId(null);
      setDropTargetId(null);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [draggingId, touchDragActive]);

  const handleThemeChange = (themeId: string) => {
    const selectedTheme = getBioTheme(themeId);
    setTheme(selectedTheme.id);
    setAccentColor(selectedTheme.defaultAccent || selectedTheme.accent);
    setTextColor(selectedTheme.defaultTextColor || selectedTheme.text);
    setActiveThemeCategory(getThemeCategory(selectedTheme));
    setIsDirty(true);
  };

  const handleProfileImageUpload = (file?: File) => {
    if (!file) return;
    readImageFile(file, (dataUrl) => {
      setProfileImageUrl(dataUrl);
      setIsDirty(true);
    }, "Profil resmi");
  };

  const handleFaviconUpload = (file?: File) => {
    if (!file) return;
    readImageFile(file, (dataUrl) => {
      setFaviconUrl(dataUrl);
      setIsDirty(true);
    }, "Sekme logosu");
  };

  const applyPalette = (accent: string, text: string) => {
    setAccentColor(accent);
    setTextColor(text);
    setIsDirty(true);
  };

  const handleBackgroundImageUpload = (file?: File) => {
    if (!file) return;
    readImageFile(file, (dataUrl) => {
      setCustomBackgroundImageUrl(dataUrl);
      setTheme("custom_photo");
      setActiveThemeCategory("photo");
      setIsDirty(true);
    }, "Arka plan fotografi");
  };

  const applySmartPreset = (kind: typeof SMART_PRESETS[number]["kind"]) => {
    const preset = SMART_PRESETS.find(item => item.kind === kind);
    if (!preset) return;

    setAccentColor(preset.accent);
    setIsDirty(true);

    if (kind === "influencer") {
      if (!pageDesc) setPageDesc("Icerik, is birlikleri ve en guncel paylasimlar");
      addBlock("social");
      addBlock("link");
      toast.success("Influencer akisi icin sosyal ve link blogu eklendi");
      return;
    }

    if (kind === "sales") {
      if (!pageDesc) setPageDesc("Urunler, kampanyalar ve hizli siparis");
      addCommerceBlock("shopier_store");
      addBlock("link");
      toast.success("Satis akisi icin magaza ve aksiyon linki eklendi");
      return;
    }

    if (!pageDesc) setPageDesc("Portfolyo, hizmetler ve teklif talepleri");
    addBlock("link");
    addBlock("description");
    toast.success("Freelancer akisi icin portfolyo ve aciklama blogu eklendi");
  };
  const previewPage = useMemo(
    () => ({
      title: pageTitle || pageData?.page.title || "",
      description: pageDesc || pageData?.page.description || "",
      profileImageUrl: profileImageUrl || pageData?.page.profileImageUrl || "",
      customBackgroundImageUrl,
      slug: pageData?.page.slug || "",
    }),
    [customBackgroundImageUrl, pageData?.page.description, pageData?.page.profileImageUrl, pageData?.page.slug, pageData?.page.title, pageDesc, pageTitle, profileImageUrl],
  );
  const socialDrafts = useMemo<SocialLinkDraft[]>(
    () =>
      blocks
        .filter((block) => block.type === "social" && getSocialPlacement(block.data) === "top")
        .map((block) => ({
          id: block.id ? String(block.id) : block.tempId,
          tempId: block.tempId,
          platform: String(block.data.platform || ""),
          url: String(block.data.url || ""),
          isEnabled: block.isEnabled,
          clicks: block.clicks ?? 0,
        })),
    [blocks],
  );
  const isSaving = updatePageMutation.isPending || bulkSaveMutation.isPending;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (!pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Sayfa bulunamadi</p>
          <Button onClick={() => navigate("/dashboard")}>Panele Don</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#07090c]">
      <Navbar />

      <BuilderTopBar
        title={pageTitle || pageData.page.title}
        slug={pageData.page.slug}
        isPublished={isPublished}
        isSaving={isSaving}
        isDirty={isDirty}
        onBack={() => navigate("/dashboard")}
        onSave={handleSave}
        onTogglePublished={(checked) => {
          setIsPublished(checked);
          setIsDirty(true);
        }}
      />

      <div className="flex-1">
        <div className="container max-w-[1500px] overflow-x-hidden py-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-start">
            <div className="min-w-0 space-y-6">
              <ProfileHeroCard
                title={pageTitle}
                description={pageDesc}
                profileImageUrl={profileImageUrl}
                faviconUrl={faviconUrl}
                socialItems={socialDrafts}
                onOpenMedia={() => setIsProfileMediaModalOpen(true)}
                onOpenText={() => setIsProfileTextModalOpen(true)}
                onOpenSocial={() => setIsSocialModalOpen(true)}
                onFaviconSelect={handleFaviconUpload}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-card/90 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
                  <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4 text-primary" />
                    Goruntulenme
                  </div>
                  <p className="text-3xl font-semibold">{pageData.page.views ?? 0}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Bu bio sayfasinin toplam gorunmesi.</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/90 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
                  <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <MousePointerClick className="h-4 w-4 text-primary" />
                    Toplam tiklama
                  </div>
                  <p className="text-3xl font-semibold">{totalClicks}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Link ve sosyal ogelerin aldigi toplam etkilesim.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobilePreview((prev) => !prev)}
                  className="rounded-2xl border border-border/60 bg-card/90 p-5 text-left shadow-[0_12px_40px_rgba(0,0,0,0.16)] transition-colors hover:border-primary/35 xl:hidden"
                >
                  <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Smartphone className="h-4 w-4 text-primary" />
                    Mobil onizleme
                  </div>
                  <p className="text-lg font-semibold">{showMobilePreview ? "Kapat" : "Ac"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Telefondaki gorunumu ihtiyacin oldugunda goster.</p>
                </button>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-[0_10px_32px_rgba(0,0,0,0.12)]">
                <button
                  type="button"
                  onClick={() => setIsSmartStartOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Akilli baslangic</span>
                  </span>
                  {isSmartStartOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {isSmartStartOpen && (
                  <div className="mt-3">
                    <p className="mb-3 text-xs text-muted-foreground">
                      Uygun baslangic setini sec. Vurgu rengi ve onerilen bloklar hizlica yerlessin.
                    </p>
                    <div className="grid gap-2 md:grid-cols-3">
                      {SMART_PRESETS.map((preset) => (
                        <button
                          key={preset.kind}
                          type="button"
                          onClick={() => applySmartPreset(preset.kind)}
                          className="rounded-xl border border-border/50 bg-background/55 px-3 py-3 text-left transition-colors hover:border-primary/45 hover:bg-primary/5"
                        >
                          <span className="block text-sm font-medium">{preset.label}</span>
                          <span className="mt-1 block text-[11px] text-muted-foreground">{preset.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <ThemePanelCard
                themeLabel={themeConfig.label}
                themePreviewStyle={getBioThemePreviewStyle(themeConfig, activeAccentColor)}
                accentColor={activeAccentColor}
                textColor={textColor}
                palettes={QUICK_PALETTES}
                customBackgroundImageUrl={customBackgroundImageUrl}
                onOpenThemeDialog={() => setIsThemeDialogOpen(true)}
                onAccentChange={(value) => {
                  setAccentColor(value);
                  setIsDirty(true);
                }}
                onTextColorChange={(value) => {
                  setTextColor(value);
                  setIsDirty(true);
                }}
                onApplyPalette={applyPalette}
                onBackgroundUpload={handleBackgroundImageUpload}
                onClearBackground={() => {
                  setCustomBackgroundImageUrl("");
                  setIsDirty(true);
                }}
              />

              <BlockListPanel
                totalBlocks={blocks.length}
                activeBlockCount={activeBlockCount}
                hiddenBlockCount={hiddenBlockCount}
                actionBlockCount={actionBlockCount}
                isSaving={isSaving}
                isDirty={isDirty}
                onSave={handleSave}
                onOpenAddDialog={() => setIsAddBlockDialogOpen(true)}
                isDragging={Boolean(draggingId)}
              >
                <div className="space-y-3">
                  {blocks.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Plus className="h-5 w-5 text-primary" />
                      </div>
                      <p className="font-medium">Henuz oge eklenmedi</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Yeni oge ekleyerek link, sosyal medya veya metin bloklariyla baslayabilirsiniz.
                      </p>
                    </div>
                  )}

                  {blocks.map((block, index) => (
                    <div
                      key={block.tempId}
                      data-block-id={block.tempId}
                      draggable={!touchDragActive}
                      onDragStart={() => {
                        setTouchDragActive(false);
                        setDraggingId(block.tempId);
                        setDropTargetId(block.tempId);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDropTargetId(null);
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDragEnter={() => {
                        if (draggingId && draggingId !== block.tempId) {
                          setDropTargetId(block.tempId);
                        }
                      }}
                      onDrop={() => {
                        if (draggingId) moveBlockTo(draggingId, block.tempId);
                        setDraggingId(null);
                        setDropTargetId(null);
                        setTouchDragActive(false);
                      }}
                      className={`relative transition-all duration-200 ${
                        draggingId === block.tempId
                          ? "scale-[0.985] opacity-55"
                          : dropTargetId === block.tempId
                            ? "scale-[1.01]"
                            : "opacity-100"
                      }`}
                    >
                      {dropTargetId === block.tempId && draggingId !== block.tempId ? (
                        <div className="pointer-events-none absolute -left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-primary/40 bg-primary text-black shadow-[0_0_18px_rgba(214,255,0,0.35)]">
                          <Check className="h-4 w-4" />
                        </div>
                      ) : null}
                      <BlockEditor
                        block={block}
                        expanded={expandedBlockIds[block.tempId] ?? false}
                        onChange={(data) => updateBlock(block.tempId, data)}
                        onDelete={() => deleteBlock(block.tempId)}
                        onToggle={() => toggleBlock(block.tempId)}
                        onToggleExpanded={() => toggleExpandedBlock(block.tempId)}
                        onMoveUp={() => moveBlock(block.tempId, "up")}
                        onMoveDown={() => moveBlock(block.tempId, "down")}
                        onTouchDragStart={() => {
                          setDraggingId(block.tempId);
                          setTouchDragActive(true);
                        }}
                        canMoveUp={index > 0}
                        canMoveDown={index < blocks.length - 1}
                      />
                    </div>
                  ))}
                </div>
              </BlockListPanel>
            </div>

            <div className={`${showMobilePreview ? "block" : "hidden"} min-w-0 xl:sticky xl:top-24 xl:block`}>
              <BuilderPreviewPanel previewMode={previewMode} onPreviewModeChange={setPreviewMode}>
                {previewMode === "desktop" ? (
                  <DesktopPreview
                    blocks={blocks}
                    page={previewPage}
                    accentColor={activeAccentColor}
                    textColor={textColor}
                    theme={themeConfig.id}
                  />
                ) : (
                  <PhonePreview
                    blocks={blocks}
                    page={previewPage}
                    accentColor={activeAccentColor}
                    textColor={textColor}
                    theme={themeConfig.id}
                  />
                )}
              </BuilderPreviewPanel>
            </div>
          </div>

          <ProfileImageModal
            open={isProfileMediaModalOpen}
            onOpenChange={setIsProfileMediaModalOpen}
            onImageSelect={handleProfileImageUpload}
          />
          <ProfileTextModal
            open={isProfileTextModalOpen}
            onOpenChange={setIsProfileTextModalOpen}
            title={pageTitle}
            description={pageDesc}
            onTitleChange={(value) => {
              setPageTitle(value);
              setIsDirty(true);
            }}
            onDescriptionChange={(value) => {
              setPageDesc(value);
              setIsDirty(true);
            }}
          />
          <SocialLinksModal
            open={isSocialModalOpen}
            onOpenChange={setIsSocialModalOpen}
            items={socialDrafts}
            onItemsChange={(items) => {
              applySocialDrafts(items);
              setIsDirty(true);
            }}
            onAdd={() => {
              addSocialDraft();
              setIsDirty(true);
            }}
          />
          <BlockLibraryDialog
            open={isAddBlockDialogOpen}
            onOpenChange={setIsAddBlockDialogOpen}
            onAddBlock={addBlock}
            onAddCommerce={addCommerceBlock}
            onAddLocation={addLocationBlock}
            disabled={blocks.length >= 50}
          />
          {isThemeDialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm">
              <div className="w-full max-w-4xl rounded-[1.5rem] border border-border/50 bg-card p-5 shadow-2xl">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Tema Secimi</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Tum temalar tek yerde. Dokunup aninda uygulayin.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsThemeDialogOpen(false)}
                    className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Tema penceresini kapat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {THEME_CATEGORY_TABS.map((tab) => (
                    <button
                      key={`theme-tab-${tab.id}`}
                      type="button"
                      onClick={() => setActiveThemeCategory(tab.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${activeThemeCategory === tab.id ? "border-primary bg-primary text-primary-foreground" : "border-border/50 text-muted-foreground hover:border-primary/45 hover:text-foreground"}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeThemeCategory === "photo" && (
                  <div className="mb-4 rounded-2xl border border-border/50 bg-background/45 p-3">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Kendi fotografini ekle</Label>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          handleBackgroundImageUpload(event.currentTarget.files?.[0]);
                          event.currentTarget.value = "";
                          setIsThemeDialogOpen(false);
                        }}
                        className="bg-input border-border/50 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">Onerilen: 1080x1920 veya 1920x1080, maksimum 7 MB</span>
                    </div>
                  </div>
                )}
                <div className="max-h-[65vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-5">
                    {visibleThemes.map(item => (
                      <button
                        key={`theme-modal-${item.id}`}
                        type="button"
                        onClick={() => {
                          handleThemeChange(item.id);
                          setIsThemeDialogOpen(false);
                        }}
                        className={`rounded-xl border p-2 text-left transition-all ${themeConfig.id === item.id ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/40"}`}
                      >
                        <div className="mb-2 h-20 rounded-lg border border-white/20" style={getBioThemePreviewStyle(item, item.accent)} />
                        <div className="mb-2 flex items-center gap-1.5">
                          {themeHasImageBackground(item) && (
                            <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              Foto
                            </span>
                          )}
                          {"backgroundAnimation" in item && item.backgroundAnimation && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              Hareketli
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium leading-tight">{item.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-[#14181d] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Hizli kaydet</p>
                    <p className="mt-1 text-xs text-muted-foreground">Degisiklikleri buradan da kaydedebilirsiniz.</p>
                  </div>
                  <Button onClick={handleSave} disabled={isSaving || !isDirty} className="bg-primary text-primary-foreground">
                    <Save className="mr-2 h-4 w-4" />
                    Kaydet
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
