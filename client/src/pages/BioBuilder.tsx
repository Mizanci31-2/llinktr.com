import { useEffect, useState } from "react";
import { useRef } from "react";
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
import {
  AlignLeft,
  AlignCenter,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
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

type BlockType = "heading" | "description" | "text" | "link" | "social" | "divider" | "profile_image";

interface LocalBlock {
  id?: number;
  tempId: string;
  type: BlockType;
  sortOrder: number;
  isEnabled: boolean;
  clicks?: number;
  data: Record<string, string | boolean | number>;
}

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
  heading: "Başlık",
  description: "Açıklama",
  text: "Metin",
  link: "Link",
  social: "Sosyal Hesap",
  divider: "İnce Çizgi",
  profile_image: "Logo / Görsel",
};

const QUICK_PALETTES = [
  { label: "Neon", accent: "#D6FF00", text: "#F8FAFC" },
  { label: "Buz", accent: "#7DD3FC", text: "#F8FAFC" },
  { label: "Mint", accent: "#86EFAC", text: "#F8FAFC" },
  { label: "Pembe", accent: "#F472B6", text: "#FFF7FB" },
  { label: "Altın", accent: "#FBBF24", text: "#FFFBEB" },
];

const SMART_PRESETS = [
  { kind: "influencer", label: "Influencer", desc: "Sosyal hesap + öne çıkan içerik", accent: "#D6FF00" },
  { kind: "sales", label: "Satış", desc: "WhatsApp + ürün/satış linki", accent: "#86EFAC" },
  { kind: "freelancer", label: "Freelancer", desc: "Portfolyo + teklif al", accent: "#7DD3FC" },
] as const;

function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function normalizeBlocks(blocks: LocalBlock[]) {
  return blocks.map((block, index) => ({ ...block, sortOrder: index }));
}

function sanitizeBlockData(data: Record<string, string | boolean | number>) {
  return Object.fromEntries(
    Object.entries(data).filter((entry): entry is [string, string | boolean | number] => {
      const value = entry[1];
      return typeof value === "string" || typeof value === "boolean" || typeof value === "number";
    }),
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
    throw new Error(presignData?.message || "Görsel yükleme bağlantısı oluşturulamadı");
  }

  const uploadResponse = await fetch(presignData.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Görsel depolama alanına yüklenemedi");
  }

  return presignData.url;
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Görsel okunamadı"));
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
      reject(new Error("Görsel okunamadı"));
    };
    reader.onerror = () => reject(new Error("Görsel okunamadı"));
    reader.readAsDataURL(file);
  });
}

async function compressImageFile(file: File, label: string) {
  if (file.type === "image/svg+xml") {
    if (file.size <= 600 * 1024) return readFileAsDataUrl(file);
    throw new Error(`${label} SVG olarak çok büyük. Lütfen PNG/JPG/WebP yükleyin.`);
  }

  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageElement(originalDataUrl);
  const maxSide = label.toLocaleLowerCase("tr").includes("profil") ? 800 : 512;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Görsel işlenemedi");
  }

  context.drawImage(image, 0, 0, width, height);
  const compressed = canvas.toDataURL("image/webp", 0.82);

  if (compressed.length > 1_200_000) {
    return canvas.toDataURL("image/jpeg", 0.72);
  }

  return compressed;
}

function readImageFile(file: File, onLoaded: (url: string) => void, label = "Görsel") {
  if (!file.type.startsWith("image/")) {
    toast.error("Lütfen geçerli bir görsel dosyası seçin");
    return;
  }

  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    toast.error(`${label} en fazla 7 MB olabilir`);
    return;
  }

  const loadingToast = toast.loading(`${label} hazırlanıyor...`);
  void compressImageFile(file, label)
    .then((dataUrl) => {
      onLoaded(dataUrl);
      toast.success(`${label} yüklendi`, { id: loadingToast });
    })
    .catch((error) => {
      toast.error(error instanceof Error ? error.message : "Görsel yüklenemedi", { id: loadingToast });
    });
}

function getBlockSummary(block: LocalBlock) {
  if (block.type === "heading") {
    return String(block.data.text || "Büyük bir başlık ekleyin");
  }

  if (block.type === "description" || block.type === "text") {
    return String(block.data.text || "Açıklama veya serbest metin alanı");
  }

  if (block.type === "link") {
    const title = String(block.data.title || (isCommerceLinkData(block.data) ? "E-ticaret sitesi" : "Link"));
    const url = String(block.data.url || "https://...");
    return `${title} - ${url}`;
  }

  if (block.type === "social") {
    const platform = SOCIAL_PLATFORMS.find(item => item.id === block.data.platform);
    return platform ? `${platform.label} hesabı` : "Platform seçin";
  }

  if (block.type === "profile_image") {
    return "Logo veya görsel bloğu";
  }

  return "Bölümler arasına ayırıcı çizgi ekler";
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
    return getDividerVariant(block.data) === "thick" ? "Kalın Çizgi" : "İnce Çizgi";
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
        frame: "border-border/70 bg-card",
        header: "border-b border-border/40 bg-background/50",
        icon: "text-primary",
        panel: "border-border/70 bg-background/55",
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
    const preset = getCommercePreset(String(data.logoPreset));
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
  onChange,
  onDelete,
  onToggle,
  onMoveUp,
  onMoveDown,
  onTouchDragStart,
  canMoveUp,
  canMoveDown,
}: {
  block: LocalBlock;
  onChange: (data: Record<string, string | boolean | number>) => void;
  onDelete: () => void;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onTouchDragStart: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const Icon = BLOCK_ICONS[block.type];
  const linkAlign = block.type === "link" ? getLinkAlignment(block.data) : "center";
  const selectedCommercePreset = block.type === "link" ? getCommercePreset(String(block.data.logoPreset || "")) : undefined;
  const selectedSocialPlatform = block.type === "social" ? SOCIAL_PLATFORMS.find(item => item.id === block.data.platform) : undefined;
  const isCommerceLink = block.type === "link" && Boolean(selectedCommercePreset);
  const tone = getBlockTone(block);
  const blockLabel = getBlockLabel(block);

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

  return (
    <div className={`min-w-0 overflow-hidden rounded-[1.15rem] border shadow-sm transition-all ${block.isEnabled ? tone.frame : "border-border/40 bg-card/55 opacity-60"}`}>
      <div className={`flex flex-wrap items-start gap-3 px-3 py-3 sm:flex-nowrap sm:items-center sm:px-3.5 sm:py-3.5 ${block.isEnabled ? tone.header : "border-b border-border/30 bg-background/45"}`}>
        <button
          type="button"
          onTouchStart={(event) => {
            event.preventDefault();
            onTouchDragStart();
          }}
          className="mt-0.5 rounded p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          aria-label="Sürükleyerek sırala"
        >
          <GripVertical className="h-4 w-4 cursor-grab flex-shrink-0" />
        </button>
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 ${block.isEnabled ? tone.badge : "bg-muted/40 text-muted-foreground"}`}>
            <Icon className={`h-4 w-4 ${block.isEnabled ? tone.icon : "text-muted-foreground"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="min-w-0 truncate text-sm font-medium">{blockLabel}</span>
              {(block.type === "link" || block.type === "social") && (
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground sm:text-[11px]">
                  {block.clicks ?? 0} tıklama
                </span>
              )}
            </div>
            <p className="mt-0.5 line-clamp-2 break-all text-[11px] leading-snug text-muted-foreground sm:truncate">{getBlockSummary(block)}</p>
          </div>
        </div>

        <div className="flex w-full flex-shrink-0 items-center justify-between gap-1 rounded-xl border border-border/40 bg-background/45 px-2 py-1.5 sm:w-auto sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
            aria-label="Bloğu yukarı taşı"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
            aria-label="Bloğu aşağı taşı"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <Switch checked={block.isEnabled} onCheckedChange={onToggle} className="scale-75" />
          <button type="button" onClick={() => setExpanded(!expanded)} className="p-1 rounded text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button type="button" onClick={onDelete} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
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
                placeholder="Başlık metni..."
                className="bg-input border-border/50 text-sm"
              />
              <div className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/55 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">Başlığı büyük harf göster</p>
                <Switch
                  checked={Boolean(block.data.uppercase)}
                  onCheckedChange={(checked) => onChange({ ...block.data, uppercase: checked })}
                  className="scale-75"
                />
              </div>
            </div>
          )}

          {block.type === "description" && (
            <Textarea
              value={String(block.data.text || "")}
              onChange={(event) => onChange({ ...block.data, text: event.target.value })}
              placeholder="Açıklama metni..."
              className="bg-input border-border/50 text-sm resize-none"
              rows={2}
            />
          )}

          {block.type === "text" && (
            <Textarea
              value={String(block.data.text || "")}
              onChange={(event) => onChange({ ...block.data, text: event.target.value })}
              placeholder="Metin içeriği..."
              className="bg-input border-border/50 text-sm resize-none"
              rows={3}
            />
          )}

          {block.type === "link" && (
            <div className="space-y-3">
              <div className={`rounded-xl border p-3 shadow-sm ${tone.panel}`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium">Yazı hizası</p>
                  <span className="text-[10px] text-muted-foreground">Varsayılan: ortalı</span>
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
                    Ortalı
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
                    <span className="text-[10px] text-muted-foreground">İsterseniz sonra değiştirebilirsiniz</span>
                  </div>
                  <Select value={selectedCommercePreset?.id || ""} onValueChange={handleCommercePresetChange}>
                    <SelectTrigger className="h-11 bg-input border-border/70 text-sm">
                      {selectedCommercePreset ? (
                        <div className="flex min-w-0 items-center gap-2">
                          <img src={selectedCommercePreset.logoUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                          <span className="truncate">{selectedCommercePreset.label}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Mağaza seçin...</span>
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
                  <p className="text-xs font-medium">{isCommerceLink ? "Mağaza bilgileri" : "Link içeriği"}</p>
                  <span className="text-[10px] text-muted-foreground">Tek satır görünür</span>
                </div>
                <Input
                  value={String(block.data.title || "")}
                  onChange={(event) => onChange({ ...block.data, title: event.target.value })}
                  placeholder={isCommerceLink ? "Mağaza adı" : "Başlık"}
                  className={`bg-input border-border/60 text-sm ${linkAlign === "center" ? "text-center" : "text-left"}`}
                />
                <Input
                  value={String(block.data.url || "")}
                  onChange={(event) => onChange({ ...block.data, url: event.target.value })}
                  placeholder={selectedCommercePreset?.placeholder || "https://..."}
                  className="bg-input border-border/60 text-sm"
                />
              </div>

              <div className={`space-y-2 rounded-xl border p-3 shadow-sm ${tone.panel}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  {block.data.logoUrl || block.data.logoPreset || block.data.logoUrlSecondary ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-background/80">
                      <div className="relative h-7 w-7">
                        <div className="absolute left-0 top-0">
                          <LinkLogo data={block.data} size={28} fallbackColor={selectedCommercePreset?.color || "#FFFFFF"} />
                        </div>
                        {block.data.logoUrlSecondary && (
                          <div className="absolute -bottom-1 -right-1 rounded-full border border-border/70 bg-background/90 p-[1px]">
                            <LinkSecondaryLogo data={block.data} size={14} />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full border border-dashed border-border/60 flex items-center justify-center">
                      <Image className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{isCommerceLink ? "Mağaza logosu" : "Link logosu"}</p>
                    {isCommerceLink ? (
                      <p className="text-[11px] text-muted-foreground">
                        Hazır e-ticaret seçiminde logo otomatik gelir. Bu blokta ayrıca logo değiştirmeniz gerekmez.
                      </p>
                    ) : (
                      <ImageUploadHint text="Link logosu için önerilen boyut 512 x 512 px, oran 1:1 kare. Yuvarlak alana tam oturması için PNG/JPG kullanın. Maksimum 7 MB." />
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
                          Logoyu kaldır
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
                      Ek logoyu kaldır
                    </Button>
                  )}
                </>
              </div>
            </div>
          )}

          {block.type === "social" && (
            <div className="space-y-3">
              <div className="rounded-xl border border-border/70 bg-background/55 p-3 shadow-sm">
                <div className="mb-2">
                  <p className="text-xs font-medium">Platform seçimi</p>
                  <p className="text-[11px] text-muted-foreground">Butona basıp sosyal platformu seçin. Logolar listede görünür.</p>
                </div>
                <Select
                  value={String(block.data.platform || "")}
                  onValueChange={(value) => onChange({ ...block.data, platform: value, url: normalizeSocialUrl(value, String(block.data.url || "")) })}
                >
                  <SelectTrigger className="h-11 bg-input border-border/70 text-sm">
                    {selectedSocialPlatform ? (
                      <div className="flex min-w-0 items-center gap-2">
                        <SocialIcon platform={selectedSocialPlatform.id} size={18} color={selectedSocialPlatform.color} />
                        <span className="truncate">{selectedSocialPlatform.label}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Platform seçin...</span>
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
                <p className="text-xs font-medium">Bağlantı</p>
                <Input
                  value={String(block.data.url || "")}
                  onChange={(event) => onChange({ ...block.data, url: normalizeSocialUrl(String(block.data.platform || ""), event.target.value) })}
                  placeholder={SOCIAL_PLATFORMS.find(platform => platform.id === block.data.platform)?.placeholder || "https://..."}
                  className="bg-input border-border/60 text-sm"
                />
                <p className="text-xs text-muted-foreground">Sosyal hesaplar bio sayfasının alt kısmında yuvarlak ikon olarak gösterilir. Ayrı başlık girmeniz gerekmez.</p>
              </div>
            </div>
          )}

          {block.type === "divider" && (
            <div className="space-y-2 rounded-xl border border-border/70 bg-background/55 p-3 shadow-sm">
              <p className="text-xs font-medium">Çizgi Kalınlığı</p>
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
                  İnce Çizgi
                </ToggleGroupItem>
                <ToggleGroupItem value="thick" className="gap-1.5 text-[11px]">
                  Kalın Çizgi
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
              <p className="text-xs text-muted-foreground">JPG, PNG veya WebP yükleyebilirsiniz. Üst sınır 5 MB.</p>
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
  const contentBlocks = enabledBlocks.filter(block => block.type !== "social");
  const socialBlocks = enabledBlocks.filter(block => block.type === "social" && block.data.url);
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
      const text = String(block.data.text || "Başlık");
      return (
          <p
            key={block.tempId}
            className={`py-1 text-center font-bold ${isDesktop ? "text-lg" : "text-sm"}`}
            style={{ color: resolvedTextColor, textTransform: block.data.uppercase ? "uppercase" : "none" }}
          >
          {block.data.uppercase ? text.toUpperCase() : text}
        </p>
      );
    }

    if (block.type === "description" || block.type === "text") {
      return (
        <p key={block.tempId} className={`px-2 text-center leading-relaxed ${isDesktop ? "text-sm" : "text-xs"}`} style={{ color: resolvedTextColor }}>
          {String(block.data.text || "Metin...")}
        </p>
      );
    }

    if (block.type === "link") {
      const align = getLinkAlignment(block.data);
      const logo = <LinkLogo data={block.data} size={iconSize} fallbackColor={accent} />;
      const secondaryLogo = <LinkSecondaryLogo data={block.data} size={Math.max(12, Math.floor(iconSize * 0.52))} />;

      return (
        <div
          key={block.tempId}
          className={`link-card link-button mx-auto grid w-full content-center place-items-center overflow-visible rounded-xl border transition-all ${isDesktop ? "min-h-[5.1rem] px-5 py-2" : "min-h-[4.1rem] max-w-[28rem] px-4 py-2"}`}
          style={buttonStyle}
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
            <span className={`link-title flex min-h-full w-full min-w-0 items-center justify-center overflow-visible truncate text-center font-medium ${isDesktop ? "px-10 text-[15px]" : "px-8 text-xs"} ${align === "left" ? "sm:justify-start sm:text-left" : ""}`} style={{ color: resolvedTextColor }}>
              {String(block.data.title || "Link")}
            </span>
            <ExternalLink className={`${isDesktop ? "h-4 w-4" : "h-3 w-3"} absolute right-0 top-1/2 -translate-y-1/2 opacity-55`} style={{ color: resolvedTextColor }} />
          </div>
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
          <img
            src={page.profileImageUrl}
            alt="Profil resmi"
            className={`${isDesktop ? "h-20 w-20" : "h-16 w-16"} rounded-full object-cover border-2`}
            style={{ borderColor: `${accent}66` }}
          />
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
            <p className={`${isDesktop ? "mt-1 text-sm" : "mt-0.5 text-xs"}`} style={{ color: resolvedTextColor }}>
              {page.description}
            </p>
          )}
        </div>
      </div>

      <div className={`w-full flex-1 ${isDesktop ? "space-y-3.5" : "space-y-2.5"}`}>
        {contentBlocks.map(renderBlock)}
      </div>

      {socialBlocks.length > 0 && (
        <div className={`flex flex-wrap justify-center ${isDesktop ? "mt-7 gap-3" : "mt-5 gap-2.5"}`}>
          {socialBlocks.map(block => (
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
          <p className="text-xs text-muted-foreground">Canlı Önizleme</p>
          <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" className="mt-0.5 flex items-center justify-center gap-1 text-xs text-primary hover:underline">
            <Globe className="h-3 w-3" />
            llinktr.com/{page.slug}
          </a>
        </div>
      </div>
    </div>
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
            Masaüstü görünümü
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
    { enabled: isAuthenticated && !!pageId },
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
  const [showCommercePresets, setShowCommercePresets] = useState(false);
  const [showLocationPresets, setShowLocationPresets] = useState(false);
  const [previewMode, setPreviewMode] = useState<"phone" | "desktop">("phone");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [touchDragActive, setTouchDragActive] = useState(false);
  const lastHydratedAtRef = useRef<Date | null>(null);
  const hydratedPageIdRef = useRef<number | null>(null);

  const themeConfig = withCustomBackgroundImage(getBioTheme(theme), customBackgroundImageUrl);
  const activeAccentColor = safeAccentColor(accentColor, themeConfig.accent);
  const visibleThemes = BIO_THEMES.filter((item) => activeThemeCategory === "all" || getThemeCategory(item) === activeThemeCategory);
  const totalClicks = blocks.reduce((sum, block) => sum + (block.clicks ?? 0), 0);
  const activeBlockCount = blocks.filter(block => block.isEnabled).length;
  const hiddenBlockCount = blocks.length - activeBlockCount;
  const actionBlockCount = blocks.filter(block => block.type === "link" || block.type === "social").length;

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
    setBlocks(normalizeBlocks(pageData.blocks.map(block => ({
      id: block.id,
      tempId: generateTempId(),
      type: block.type as BlockType,
      sortOrder: block.sortOrder,
      isEnabled: block.isEnabled,
      clicks: block.clicks ?? 0,
      data: (block.data as Record<string, string | boolean | number>) || {},
    }))));
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
      setBlocks(normalizeBlocks(savedBlocks.map(block => ({
        id: block.id,
        tempId: generateTempId(),
        type: block.type as BlockType,
        sortOrder: block.sortOrder,
        isEnabled: block.isEnabled,
        clicks: block.clicks ?? 0,
        data: (block.data as Record<string, string | boolean | number>) || {},
      }))));
      setIsDirty(false);
      toast.success("Kaydedildi");
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSave = async () => {
    try {
      const existingBlockCount = pageData?.blocks?.length ?? 0;
      const allowEmptyBlocks = blocks.length === 0 && existingBlockCount > 0;
      if (blocks.length === 0 && existingBlockCount > 0) {
        const confirmed = window.confirm(
          "Tüm içerik blokları silinecek. Boş olarak kaydetmek istediğinize emin misiniz?",
        );
        if (!confirmed) return;
      }

      await updatePageMutation.mutateAsync({
        id: pageId,
        title: pageTitle,
        description: pageDesc || null,
        profileImageUrl: profileImageUrl || null,
        faviconUrl: faviconUrl || null,
        theme,
        selectedThemeId: theme,
        accentColor: activeAccentColor,
        textColor,
        customBackgroundImageUrl: customBackgroundImageUrl || null,
        themeCategory: activeThemeCategory === "all" ? null : activeThemeCategory,
        isPublished,
      });

      await bulkSaveMutation.mutateAsync({
        pageId,
        allowEmpty: allowEmptyBlocks,
        blocks: blocks.map((block, index) => ({
          id: block.id,
          type: block.type,
          sortOrder: index,
          isEnabled: block.isEnabled,
          data: sanitizeBlockData(block.data),
        })),
      });

      await Promise.allSettled([
        utils.bioPages.getById.invalidate({ id: pageId }),
        utils.bioPages.list.invalidate(),
        pageData?.page?.slug
          ? utils.bioPages.getBySlug.invalidate({ slug: pageData.page.slug })
          : Promise.resolve(),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const addBlock = (type: BlockType) => {
    if (blocks.length >= 50) {
      toast.error("Maksimum 50 öğe sınırına ulaştınız");
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
          : type === "link"
            ? { align: "center" }
            : type === "divider"
              ? { variant: "thin" }
            : {},
    };
    setBlocks(prev => normalizeBlocks([...prev, newBlock]));
    setIsDirty(true);
    setIsAddBlockDialogOpen(false);
    setShowCommercePresets(false);
    setShowLocationPresets(false);
  };

  const addCommerceBlock = (presetId: string) => {
    if (blocks.length >= 50) {
      toast.error("Maksimum 50 öğe sınırına ulaştınız");
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
    setIsDirty(true);
    setIsAddBlockDialogOpen(false);
    setShowCommercePresets(false);
    setShowLocationPresets(false);
  };

  const addLocationBlock = (presetId: string) => {
    if (blocks.length >= 50) {
      toast.error("Maksimum 50 öğe sınırına ulaştınız");
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
    setIsDirty(true);
    setIsAddBlockDialogOpen(false);
    setShowLocationPresets(false);
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

      moveBlockTo(draggingId, targetId);
    };

    const handleTouchEnd = () => {
      setTouchDragActive(false);
      setDraggingId(null);
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
    }, "Arka plan fotoğrafı");
  };

  const applySmartPreset = (kind: typeof SMART_PRESETS[number]["kind"]) => {
    const preset = SMART_PRESETS.find(item => item.kind === kind);
    if (!preset) return;

    setAccentColor(preset.accent);
    setIsDirty(true);

    if (kind === "influencer") {
      if (!pageDesc) setPageDesc("İçerik, iş birlikleri ve en güncel paylaşımlar");
      addBlock("social");
      addBlock("link");
      toast.success("Influencer akışı için sosyal ve link bloğu eklendi");
      return;
    }

    if (kind === "sales") {
      if (!pageDesc) setPageDesc("Ürünler, kampanyalar ve hızlı sipariş");
      addCommerceBlock("shopier_store");
      addBlock("link");
      toast.success("Satış akışı için mağaza ve aksiyon linki eklendi");
      return;
    }

    if (!pageDesc) setPageDesc("Portfolyo, hizmetler ve teklif talepleri");
    addBlock("link");
    addBlock("description");
    toast.success("Freelancer akışı için portfolyo ve açıklama bloğu eklendi");
  };
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
          <p className="text-muted-foreground mb-4">Sayfa bulunamadı</p>
          <Button onClick={() => navigate("/dashboard")}>Panele Dön</Button>
        </div>
      </div>
    );
  }

  const isSaving = updatePageMutation.isPending || bulkSaveMutation.isPending;
  const previewPage = {
    title: pageTitle || pageData.page.title,
    description: pageDesc || pageData.page.description,
    profileImageUrl: profileImageUrl || pageData.page.profileImageUrl,
    customBackgroundImageUrl,
    slug: pageData.page.slug,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="border-b border-border/50 bg-card/50 sticky top-16 z-40 backdrop-blur-xl">
        <div className="container py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="h-9 flex-shrink-0 px-2 text-xs text-muted-foreground sm:px-3 sm:text-sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Panel
            </Button>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <div className="min-w-0">
              <h1 className="text-sm font-semibold truncate">{pageData.page.title}</h1>
              <p className="text-xs text-muted-foreground truncate">llinktr.com/{pageData.page.slug}</p>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border/50 px-3 py-1.5">
              <span className="text-xs text-muted-foreground">{isPublished ? "Yayında" : "Durduruldu"}</span>
              <Switch checked={isPublished} onCheckedChange={(checked) => { setIsPublished(checked); setIsDirty(true); }} className="scale-75" />
            </div>
            <a href={`/${pageData.page.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="h-9 border-border/50 px-3 text-xs">
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Görüntüle
              </Button>
            </a>
            <Button size="sm" onClick={handleSave} disabled={isSaving || !isDirty} className="h-9 bg-primary px-3 text-xs text-primary-foreground shadow-[0_0_15px_oklch(0.93_0.23_110/0.25)]">
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="h-3.5 w-3.5 mr-1.5" />Kaydet</>}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 container max-w-[1480px] overflow-x-hidden py-6">
        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(560px,1fr)_minmax(420px,520px)] xl:items-start">
          <div className="space-y-6">
            <div className="panel-strong p-5 rounded-2xl bg-card border border-border/70">
              <h2 className="font-semibold mb-4">Profil Detayları</h2>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_210px]">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Sayfa Başlığı</Label>
                    <div className="flex items-center gap-2">
                      <Input value={pageTitle} onChange={(event) => { setPageTitle(event.target.value); setIsDirty(true); }} placeholder="Sayfa başlığı..." className="min-w-0 bg-input border-border/50" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPageTitle(prev => prev.toUpperCase());
                          setIsDirty(true);
                        }}
                        className="h-10 whitespace-nowrap text-[11px]"
                      >
                        BÜYÜK HARF
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Kısa Açıklama</Label>
                    <Input value={pageDesc} onChange={(event) => { setPageDesc(event.target.value); setIsDirty(true); }} placeholder="Dijital içerik üreticisi" className="bg-input border-border/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Profil Resmi URL</Label>
                    <Input value={profileImageUrl} onChange={(event) => { setProfileImageUrl(event.target.value); setIsDirty(true); }} placeholder="https://..." className="bg-input border-border/60" />
                    <ImageUploadHint text="Profil resmi için önerilen boyut 800 x 800 px, oran 1:1 kare. Yuvarlak alana tam oturur. Maksimum 7 MB." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Sekme Logosu URL (Favicon)</Label>
                    <Input value={faviconUrl} onChange={(event) => { setFaviconUrl(event.target.value); setIsDirty(true); }} placeholder="https://..." className="bg-input border-border/60" />
                    <ImageUploadHint text="Sekme logosu için önerilen boyut 512 x 512 px, oran 1:1 kare. Boş bırakırsanız varsayılan llinktr logosu kullanılır. Maksimum 7 MB." />
                  </div>
                </div>
                <div className="panel-strong rounded-xl border border-border/70 bg-muted/20 p-4 flex flex-col items-center justify-center gap-3">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="Profil resmi" className="h-20 w-20 rounded-full object-cover border border-border/50" />
                  ) : (
                    <div className="h-20 w-20 rounded-full border border-border/50 bg-muted flex items-center justify-center">
                      <UserRound className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      handleProfileImageUpload(event.currentTarget.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                    className="bg-input border-border/50 text-xs"
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      handleFaviconUpload(event.currentTarget.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                    className="bg-input border-border/50 text-xs"
                  />
                  <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2">
                    <img src={faviconUrl || "/favicon.svg"} alt="Sekme logosu" className="h-5 w-5 rounded-sm object-cover" />
                    <span className="text-[11px] text-muted-foreground">{faviconUrl ? "Ozel sekme logosu secili" : "Varsayilan logo aktif"}</span>
                  </div>
                  {profileImageUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setProfileImageUrl(""); setIsDirty(true); }} className="h-8 text-xs text-muted-foreground">
                      <X className="h-3.5 w-3.5 mr-1" />
                      Kaldır
                    </Button>
                  )}
                  {faviconUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setFaviconUrl(""); setIsDirty(true); }} className="h-8 text-xs text-muted-foreground">
                      <X className="h-3.5 w-3.5 mr-1" />
                      Sekme logosunu sifirla
                    </Button>
                  )}
                  <p className="text-[11px] text-muted-foreground text-center">İsteğe bağlıdır. En fazla 7 MB görsel kabul edilir.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-card border border-border/50 flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pageData.page.views ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Sayfa görüntülenmesi</p>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-card border border-border/50 flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MousePointerClick className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalClicks}</p>
                  <p className="text-xs text-muted-foreground">Toplam link tıklaması</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5">
              <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">Akıllı başlangıç</h2>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">Ne yapıyorsun? Seç, sana uygun blokları ve vurgu rengini anında hazırlayalım.</p>
                <div className="grid gap-2">
                  {SMART_PRESETS.map((preset) => (
                    <button
                      key={preset.kind}
                      type="button"
                      onClick={() => applySmartPreset(preset.kind)}
                      className="rounded-xl border border-border/50 bg-background/55 px-3 py-2 text-left transition-colors hover:border-primary/45 hover:bg-primary/5"
                    >
                      <span className="block text-sm font-medium">{preset.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{preset.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Tema ve Renk</h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tema Seçimi</Label>
                  <button
                    type="button"
                    onClick={() => setIsThemeDialogOpen(true)}
                    className="w-full rounded-xl border border-border/50 bg-input px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-16 rounded-lg border border-border/50" style={getBioThemePreviewStyle(themeConfig, activeAccentColor)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight">Temaları Aç</p>
                        <p className="truncate text-xs text-muted-foreground">Seçili tema: {themeConfig.label}</p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Vurgu Rengi</Label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={activeAccentColor} onChange={(event) => { setAccentColor(event.target.value); setIsDirty(true); }} className="h-10 w-16 rounded-lg cursor-pointer border border-border/50 bg-transparent" />
                    <Input value={accentColor} onChange={(event) => { setAccentColor(event.target.value); setIsDirty(true); }} placeholder="#22D3EE" className="bg-input border-border/50 font-mono text-sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">Vurgu rengi sadece buton, ikon, border ve aktif ogeleri degistirir; tema arka plani sabit kalir.</p>
                </div>

                <div className="space-y-3 rounded-xl border border-border/50 bg-background/40 p-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Hazır Paletler</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {QUICK_PALETTES.map((palette) => (
                      <button
                        key={palette.label}
                        type="button"
                        onClick={() => applyPalette(palette.accent, palette.text)}
                        className="flex items-center gap-2 rounded-lg border border-border/50 bg-input px-2.5 py-2 text-xs transition-colors hover:border-primary/50"
                      >
                        <span className="h-4 w-4 rounded-full border border-white/20" style={{ background: palette.accent }} />
                        {palette.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Yazı Rengi</Label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={textColor} onChange={(event) => { setTextColor(event.target.value); setIsDirty(true); }} className="h-10 w-16 rounded-lg cursor-pointer border border-border/50 bg-transparent" />
                    <Input value={textColor} onChange={(event) => { setTextColor(event.target.value); setIsDirty(true); }} placeholder="#F8FAFC" className="bg-input border-border/50 font-mono text-sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">Yazi rengi bio sayfasindaki baslik, aciklama, link ve kucuk metinlerin tamamina uygulanir.</p>
                </div>

                <div className="space-y-2 rounded-xl border border-border/50 bg-background/40 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Fotograf Temasi</Label>
                      <p className="mt-1 text-xs text-muted-foreground">Onerilen: 1080x1920 veya 1920x1080, maksimum 7 MB</p>
                    </div>
                    {customBackgroundImageUrl && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setCustomBackgroundImageUrl(""); setIsDirty(true); }} className="h-8 text-xs text-muted-foreground">
                        Kaldir
                      </Button>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      handleBackgroundImageUpload(event.currentTarget.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                    className="bg-input border-border/50 text-xs"
                  />
                  {customBackgroundImageUrl && (
                    <div className="h-24 rounded-xl border border-border/50 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.18), rgba(0,0,0,0.36)), url(${customBackgroundImageUrl})` }} />
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold">İçerik Blokları</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Blokları sürükleyip sıralayın, tek tek açıp düzenleyin ve bio sayfanızı daha rahat kurun.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start">
                  <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${blocks.length >= 50 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${blocks.length >= 50 ? "bg-destructive" : "bg-primary"}`} />
                    {blocks.length}/50 öğe
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setShowCommercePresets(false);
                      setShowLocationPresets(false);
                      setIsAddBlockDialogOpen(true);
                    }}
                    disabled={blocks.length >= 50}
                    className="bg-primary text-primary-foreground"
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Yeni blok
                  </Button>
                </div>
              </div>
              <div className="mb-4 border-y border-border/40 py-2.5">
                <div className="mx-auto w-full max-w-sm">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || !isDirty}
                    className="w-full bg-primary text-primary-foreground shadow-[0_0_15px_oklch(0.93_0.23_110/0.25)]"
                  >
                    {isSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                    Kayıt Et
                  </Button>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Aktif</p>
                  <p className="mt-1 text-2xl font-semibold">{activeBlockCount}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Yayında görünen bloklar</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Gizli</p>
                  <p className="mt-1 text-2xl font-semibold">{hiddenBlockCount}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Şimdilik kapalı duran bloklar</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Aksiyon</p>
                  <p className="mt-1 text-2xl font-semibold">{actionBlockCount}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Link ve sosyal hesap öğeleri</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {blocks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 px-4 py-8 text-center">
                    <p className="text-sm font-medium">Henüz blok eklenmedi</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Sağ üstteki butondan veya aşağıdaki hızlı ekleme alanından başlayabilirsiniz.
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
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggingId) moveBlockTo(draggingId, block.tempId);
                      setDraggingId(null);
                      setTouchDragActive(false);
                    }}
                    className={`transition-opacity ${draggingId === block.tempId ? "opacity-50" : "opacity-100"}`}
                  >
                    <BlockEditor
                      block={block}
                      onChange={(data) => updateBlock(block.tempId, data)}
                      onDelete={() => deleteBlock(block.tempId)}
                      onToggle={() => toggleBlock(block.tempId)}
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

              <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
                <div className="mb-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <GripVertical className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  <p>Blokları oklarla veya sürükle-bırak ile sıralayabilir, anahtarla gizleyebilir ve sağdaki okla detay düzenlemeyi açıp kapatabilirsiniz.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {BLOCK_TYPES.map(blockType => {
                    const Icon = BLOCK_ICONS[blockType.type as BlockType];
                    return (
                      <button
                        key={blockType.type}
                        type="button"
                        onClick={() => addBlock(blockType.type as BlockType)}
                        disabled={blocks.length >= 50}
                        className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-background/60 p-2.5 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium">{blockType.label}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{blockType.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 border-t border-border/30 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCommercePresets(prev => !prev)}
                    disabled={blocks.length >= 50}
                    className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-background/60 px-3 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <span className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Hazır e-ticaret siteleri</span>
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showCommercePresets ? "rotate-180" : ""}`} />
                  </button>
                  {showCommercePresets && (
                    <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-3">
                      {COMMERCE_LINK_PRESETS.map((preset) => (
                        <button
                          key={`quick-commerce-${preset.id}`}
                          type="button"
                          onClick={() => addCommerceBlock(preset.id)}
                          disabled={blocks.length >= 50}
                          className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/60 p-2 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90">
                            <img src={preset.logoUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                          </div>
                          <span className="truncate text-xs font-medium">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-4 border-t border-border/30 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowLocationPresets(prev => !prev)}
                    disabled={blocks.length >= 50}
                    className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-background/60 px-3 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Hazır konum linkleri</span>
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showLocationPresets ? "rotate-180" : ""}`} />
                  </button>
                  {showLocationPresets && (
                    <div className="mt-3 grid grid-cols-1 gap-2 xl:grid-cols-3">
                      {LOCATION_LINK_PRESETS.map((preset) => (
                        <button
                          key={`quick-location-${preset.id}`}
                          type="button"
                          onClick={() => addLocationBlock(preset.id)}
                          disabled={blocks.length >= 50}
                          className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/60 p-2 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90">
                            <img src={preset.logoUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                          </div>
                          <span className="truncate text-xs font-medium">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="outline" className="mt-3 w-full border-dashed border-border/50 px-3 text-[11px] leading-snug text-muted-foreground whitespace-normal text-center" disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Profil resmi üstteki Profil Detayları alanından eklenir.
                </Button>
              </div>

              {isAddBlockDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm">
                  <div className="w-full max-w-2xl rounded-[1.5rem] border border-border/50 bg-card p-5 shadow-2xl">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">Yeni blok ekle</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Bio sayfanıza eklemek istediğiniz öğeyi seçin. Eklenen blok anında listenize gelir.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCommercePresets(false);
                          setShowLocationPresets(false);
                          setIsAddBlockDialogOpen(false);
                        }}
                        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Pencereyi kapat"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {BLOCK_TYPES.map(blockType => {
                        const Icon = BLOCK_ICONS[blockType.type as BlockType];
                        return (
                          <button
                            key={`dialog-${blockType.type}`}
                            type="button"
                            onClick={() => addBlock(blockType.type as BlockType)}
                            disabled={blocks.length >= 50}
                            className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/60 p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{blockType.label}</p>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{blockType.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-5 border-t border-border/30 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCommercePresets(prev => !prev)}
                        className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-background/60 px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
                      >
                        <span className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Hazır e-ticaret siteleri</span>
                        </span>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showCommercePresets ? "rotate-180" : ""}`} />
                      </button>
                      {showCommercePresets && (
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {COMMERCE_LINK_PRESETS.map((preset) => (
                            <button
                              key={`commerce-dialog-${preset.id}`}
                              type="button"
                              onClick={() => addCommerceBlock(preset.id)}
                              disabled={blocks.length >= 50}
                              className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/60 p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90">
                                <img src={preset.logoUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{preset.label}</p>
                                <p className="truncate text-[11px] text-muted-foreground">{preset.placeholder.replace("https://", "")}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-5 border-t border-border/30 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowLocationPresets(prev => !prev)}
                        className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-background/60 px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Hazır konum linkleri</span>
                        </span>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showLocationPresets ? "rotate-180" : ""}`} />
                      </button>
                      {showLocationPresets && (
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {LOCATION_LINK_PRESETS.map((preset) => (
                            <button
                              key={`location-dialog-${preset.id}`}
                              type="button"
                              onClick={() => addLocationBlock(preset.id)}
                              disabled={blocks.length >= 50}
                              className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/60 p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90">
                                <img src={preset.logoUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{preset.label}</p>
                                <p className="truncate text-[11px] text-muted-foreground">{preset.placeholder.replace("https://", "")}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-fit min-w-0 xl:sticky xl:top-24">
            <div className="min-w-0 rounded-2xl border border-border/50 bg-card/80 p-3 backdrop-blur sm:p-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Canlı Önizleme</h2>
                  <p className="text-xs text-muted-foreground">Düzenlediğiniz sayfanın telefon ve masaüstü görünümünü aynı akışta kontrol edin.</p>
                </div>
                <ToggleGroup
                  type="single"
                  value={previewMode}
                  onValueChange={(value) => {
                    if (value === "phone" || value === "desktop") {
                      setPreviewMode(value);
                    }
                  }}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <ToggleGroupItem value="phone" className="gap-2">
                    <Smartphone className="h-4 w-4" />
                    Telefon
                  </ToggleGroupItem>
                  <ToggleGroupItem value="desktop" className="gap-2">
                    <Monitor className="h-4 w-4" />
                    Masaüstü
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="min-w-0 overflow-hidden rounded-2xl border border-border/40 bg-background/35 p-2 sm:p-4">
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
              </div>
            </div>
          </div>
        </div>

          {isThemeDialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm">
              <div className="w-full max-w-4xl rounded-[1.5rem] border border-border/50 bg-card p-5 shadow-2xl">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Tema Seçimi</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Tüm temalar tek yerde. Dokunup anında uygulayın.</p>
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
            </div>
          )}
      </div>
    </div>
  );
}
