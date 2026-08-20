import {
  AlignLeft,
  CalendarDays,
  FileText,
  Heading1,
  Image,
  Link,
  MapPin,
  Minus,
  Package,
  Plus,
  Search,
  Shapes,
  Share2,
  Sparkles,
  Store,
  Type,
  Video,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BLOCK_TYPES, COMMERCE_LINK_PRESETS, LOCATION_LINK_PRESETS } from "@/lib/constants";
import type { BlockType } from "./types";

interface BlockLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddBlock: (type: BlockType, initialData?: Record<string, string | boolean | number>) => void;
  onAddCommerce: (presetId: string) => void;
  onAddLocation: (presetId: string) => void;
  disabled?: boolean;
}

type IconComponent = ComponentType<{ className?: string }>;

const blockIcons: Record<string, IconComponent> = {
  heading: Heading1,
  description: AlignLeft,
  text: Type,
  link: Link,
  social: Share2,
  location: MapPin,
  divider: Minus,
  profile_image: Image,
};

const widgets = [
  { title: "Embed", desc: "YouTube, Spotify veya �zel g�mme alan1", icon: Shapes, query: "embed youtube spotify" },
  { title: "Takvim", desc: "Randevu veya rezervasyon balant1s1", icon: CalendarDays, query: "takvim randevu rezervasyon" },
  { title: "Form", desc: "Lead veya ileti_im toplama kart1", icon: FileText, query: "form lead iletisim ileti_im" },
  { title: "Video", desc: "Video veya medya alan1", icon: Video, query: "video medya" },
  { title: "�r�n", desc: "Sat1_ odakl1 �r�n tan1t1m kart1", icon: Package, query: "urun �r�n satis sat1_" },
];

function matchesQuery(query: string, ...values: Array<string | undefined>) {
  if (!query) return true;
  const haystack = values.join(" ").toLocaleLowerCase("tr-TR");
  return haystack.includes(query);
}

function AddItemSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="sticky top-0 z-10 border-b border-white/10 bg-[#101317]/95 px-4 py-4 backdrop-blur sm:px-6">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Blok, sosyal medya, maaza veya balant1 t�r� ara"
          className="h-12 rounded-2xl border-white/15 bg-[#15191f] pl-11 text-sm shadow-inner placeholder:text-muted-foreground/80 focus-visible:border-primary focus-visible:ring-primary/25"
        />
      </div>
    </div>
  );
}

function AddItemCategory({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: IconComponent;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-4 shadow-[0_18px_46px_rgba(0,0,0,0.22)]">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="grid gap-2.5">{children}</div>
    </section>
  );
}

function AddItemCard({
  title,
  description,
  icon,
  image,
  disabled,
  onClick,
}: {
  title: string;
  description: string;
  icon?: IconComponent;
  image?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = icon || Sparkles;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group flex min-h-[78px] w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#141820]/90 p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/55 hover:bg-primary/[0.055] hover:shadow-[0_0_24px_rgba(214,255,0,0.08)] disabled:cursor-not-allowed disabled:opacity-45"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-background/70 text-primary transition group-hover:border-primary/45">
        {image ? <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" /> : <Icon className="h-5 w-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{title}</span>
        <span className="mt-1 line-clamp-2 block text-xs leading-snug text-muted-foreground">{description}</span>
      </span>
      <Plus className="h-4 w-4 shrink-0 text-primary opacity-0 transition group-hover:opacity-100" />
    </button>
  );
}

function ComingSoonCard({ title, description, icon: Icon }: { title: string; description: string; icon: IconComponent }) {
  return (
    <button
      type="button"
      onClick={() => toast.info("Bu �zellik yak1nda aktif olacak")}
      className="group flex min-h-[74px] w-full items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-[#12161d]/70 p-3.5 text-left opacity-80 transition hover:border-primary/35 hover:opacity-100"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-background/60 text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{title}</span>
          <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
            Yak1nda
          </span>
        </span>
        <span className="mt-1 line-clamp-2 block text-xs leading-snug text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}

export function BlockLibraryDialog({
  open,
  onOpenChange,
  onAddBlock,
  onAddCommerce,
  onAddLocation,
  disabled = false,
}: BlockLibraryDialogProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

  const filteredBlocks = useMemo(
    () =>
      BLOCK_TYPES.filter((item) =>
        matchesQuery(
          normalizedQuery,
          item.label,
          item.desc,
          item.type === "social" ? "instagram tiktok youtube sosyal" : undefined,
          item.type === "location" ? "harita konum maps yol tarifi adres" : undefined,
        ),
      ),
    [normalizedQuery],
  );

  const filteredCommerce = useMemo(
    () => COMMERCE_LINK_PRESETS.filter((item) => matchesQuery(normalizedQuery, item.label, item.placeholder, "eticaret e-ticaret maaza magaza sat1_ satis")),
    [normalizedQuery],
  );

  const filteredLocations = useMemo(
    () => LOCATION_LINK_PRESETS.filter((item) => matchesQuery(normalizedQuery, item.label, item.placeholder, "harita konum maps adres yol tarifi")),
    [normalizedQuery],
  );

  const filteredWidgets = useMemo(
    () => widgets.filter((item) => matchesQuery(normalizedQuery, item.title, item.desc, item.query)),
    [normalizedQuery],
  );

  const empty = filteredBlocks.length + filteredCommerce.length + filteredLocations.length + filteredWidgets.length === 0;

  const closeWithSuccess = (message: string) => {
    onOpenChange(false);
    toast.success(message);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[94svh] w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-[28px] border-white/10 bg-[#101317] p-0 shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:max-h-[88vh] sm:max-w-[1140px] [&_[data-slot=dialog-close]]:right-5 [&_[data-slot=dialog-close]]:top-5 [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:border [&_[data-slot=dialog-close]]:border-white/15 [&_[data-slot=dialog-close]]:bg-white/8 [&_[data-slot=dialog-close]]:p-2 [&_[data-slot=dialog-close]]:opacity-100 [&_[data-slot=dialog-close]]:hover:border-primary/45 [&_[data-slot=dialog-close]]:hover:bg-primary/10"
      >
        <DialogHeader className="shrink-0 border-b border-white/10 px-5 pb-4 pt-5 sm:px-6">
          <div className="max-w-2xl pr-12">
            <DialogTitle className="text-2xl font-black tracking-tight">Yeni �e Ekle</DialogTitle>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Bio sayfan1 b�y�tmek i�in blok, maaza balant1s1 veya konum kart1 se�.
            </p>
          </div>
        </DialogHeader>

        <AddItemSearch value={query} onChange={setQuery} />

        <div className="add-item-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {empty ? (
            <div className="flex min-h-[22rem] items-center justify-center rounded-3xl border border-dashed border-white/12 bg-background/45 text-center">
              <div>
                <Search className="mx-auto mb-3 h-7 w-7 text-primary" />
                <p className="text-base font-bold">Sonu� bulunamad1</p>
                <p className="mt-1 text-sm text-muted-foreground">Farkl1 bir kelime veya platform ad1 deneyin.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(230px,0.9fr)_minmax(330px,1.16fr)_minmax(285px,0.96fr)]">
              <AddItemCategory title="Temel bloklar" description="Ba_l1k, metin, link, sosyal medya ve g�rsel alanlar1." icon={Sparkles}>
                {filteredBlocks.map((blockType) => {
                  const Icon = blockIcons[blockType.type] || Sparkles;
                  return (
                    <AddItemCard
                      key={`${blockType.type}-${blockType.label}`}
                      title={blockType.label}
                      description={blockType.desc}
                      icon={Icon}
                      disabled={disabled}
                      onClick={() => {
                        onAddBlock(blockType.type as BlockType, "initialData" in blockType ? blockType.initialData : undefined);
                        closeWithSuccess(`${blockType.label} eklendi`);
                      }}
                    />
                  );
                })}
              </AddItemCategory>

              <AddItemCategory title="Haz1r e-ticaret" description="Sat1_, maaza ve sipari_ ak1_lar1 i�in h1zl1 balant1lar." icon={Store}>
                <div className="grid max-h-none gap-2.5 lg:max-h-[560px] lg:overflow-y-auto lg:pr-1">
                  {filteredCommerce.map((preset) => (
                    <AddItemCard
                      key={preset.id}
                      title={preset.label}
                      description={preset.placeholder.replace("https://", "")}
                      image={preset.logoUrl}
                      disabled={disabled}
                      onClick={() => {
                        onAddCommerce(preset.id);
                        closeWithSuccess(`${preset.label} eklendi`);
                      }}
                    />
                  ))}
                </div>
              </AddItemCategory>

              <div className="grid min-h-0 gap-4">
                <AddItemCategory title="Konum" description="Adres, harita ve yol tarifi kartlar1." icon={MapPin}>
                  {filteredLocations.map((preset) => (
                    <AddItemCard
                      key={preset.id}
                      title={preset.label}
                      description="Harita kart1 ve yol tarifi"
                      image={preset.logoUrl}
                      disabled={disabled}
                      onClick={() => {
                        onAddLocation(preset.id);
                        closeWithSuccess(`${preset.label} eklendi`);
                      }}
                    />
                  ))}
                </AddItemCategory>

                <AddItemCategory title="Yak1nda gelecek widgetlar" description="Geli_mi_ i�erik bloklar1 haz1rl1k a_amas1nda." icon={Shapes}>
                  {filteredWidgets.map((widget) => (
                    <ComingSoonCard key={widget.title} title={widget.title} description={widget.desc} icon={widget.icon} />
                  ))}
                </AddItemCategory>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-white/10 bg-primary/[0.055] px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-muted-foreground">Eklenen �eyi d�zenleme panelinden an1nda �zelle_tirebilirsin.</p>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
            <Plus className="h-3.5 w-3.5" />
            H1zl1 kurulum
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
