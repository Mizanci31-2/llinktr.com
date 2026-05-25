import { Search, Store, MapPin, Plus, Sparkles, Shapes, Heading1, AlignLeft, Type, Link, Share2, Minus, Image, Video, CalendarDays, FileText, Package } from "lucide-react";
import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BLOCK_TYPES, COMMERCE_LINK_PRESETS, LOCATION_LINK_PRESETS } from "@/lib/constants";
import type { BlockType } from "./types";

interface BlockLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddBlock: (type: BlockType) => void;
  onAddCommerce: (presetId: string) => void;
  onAddLocation: (presetId: string) => void;
  disabled?: boolean;
}

const blockIcons: Record<string, ComponentType<{ className?: string }>> = {
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
  { title: "Embed karti", desc: "YouTube, Spotify veya ozel gomme alani", icon: Shapes, query: "embed youtube spotify" },
  { title: "Takvim / randevu", desc: "Rezervasyon veya takvim baglantisi", icon: CalendarDays, query: "takvim randevu rezervasyon" },
  { title: "Form / toplama", desc: "Lead veya iletisim toplama karti", icon: FileText, query: "form lead iletisim" },
  { title: "Video / medya", desc: "Video veya medya alani", icon: Video, query: "video medya" },
  { title: "Urun karti", desc: "Urun tanitim karti", icon: Package, query: "urun satis" },
];

function matchesQuery(query: string, ...values: Array<string | undefined>) {
  if (!query) return true;
  const haystack = values.join(" ").toLocaleLowerCase("tr-TR");
  return haystack.includes(query);
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
        matchesQuery(normalizedQuery, item.label, item.desc, item.type === "social" ? "instagram tiktok youtube sosyal" : undefined, item.type === "location" ? "harita konum maps yol tarifi adres" : undefined),
      ),
    [normalizedQuery],
  );

  const filteredCommerce = useMemo(
    () => COMMERCE_LINK_PRESETS.filter((item) => matchesQuery(normalizedQuery, item.label, item.placeholder, "eticaret magaza satis")),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[96svh] w-[calc(100vw-1rem)] flex-col overflow-hidden border-border/60 bg-[#111418] p-0 sm:max-h-[88vh] sm:max-w-[1120px]">
        <DialogHeader className="shrink-0 border-b border-border/60 px-5 pb-4 pt-5">
          <DialogTitle>Yeni Öğe Ekle</DialogTitle>
        </DialogHeader>

        <div className="shrink-0 border-b border-border/50 px-4 py-4 sm:px-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Blok, platform veya bağlantı türü ara"
              className="h-11 bg-input pl-9 text-sm"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          {empty ? (
            <div className="flex min-h-[18rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/45 text-center">
              <div>
                <Search className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-semibold">Sonuc bulunamadi</p>
                <p className="mt-1 text-xs text-muted-foreground">Farkli bir kelime deneyin.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(230px,0.88fr)_minmax(330px,1.16fr)_minmax(285px,0.96fr)]">
              <section className="rounded-2xl border border-border/60 bg-background/45 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Temel bloklar</h3>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  {filteredBlocks.map((blockType) => {
                    const Icon = blockIcons[blockType.type] || Sparkles;
                    return (
                      <button
                        key={blockType.type}
                        type="button"
                        disabled={disabled}
                        onClick={() => onAddBlock(blockType.type as BlockType)}
                        className="group flex min-h-[68px] items-start gap-3 rounded-xl border border-border/50 bg-card/80 p-3 text-left transition hover:border-primary/55 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/70 text-primary transition group-hover:border-primary/45">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{blockType.label}</span>
                          <span className="mt-1 line-clamp-2 block text-xs leading-snug text-muted-foreground">{blockType.desc}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="flex min-h-0 flex-col rounded-2xl border border-border/60 bg-background/45 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Hazir e-ticaret</h3>
                </div>
                <div className="grid max-h-[46vh] gap-2 overflow-y-auto pr-1 lg:max-h-[560px]">
                  {filteredCommerce.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => onAddCommerce(preset.id)}
                      className="flex min-h-[68px] items-center gap-3 rounded-xl border border-border/50 bg-card/80 p-3 text-left transition hover:border-primary/55 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <img src={preset.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" loading="lazy" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{preset.label}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{preset.placeholder.replace("https://", "")}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <div className="grid min-h-0 gap-4">
                <section className="rounded-2xl border border-border/60 bg-background/45 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Konum seçenekleri</h3>
                  </div>
                  <div className="grid gap-2">
                    {filteredLocations.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => onAddLocation(preset.id)}
                        className="flex min-h-[68px] items-center gap-3 rounded-xl border border-border/50 bg-card/80 p-3 text-left transition hover:border-primary/55 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <img src={preset.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" loading="lazy" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{preset.label}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">Harita karti ve yol tarifi</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-border/60 bg-background/45 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Shapes className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Widget ekleme</h3>
                  </div>
                  <div className="grid gap-2">
                    {filteredWidgets.map((widget) => {
                      const Icon = widget.icon;
                      return (
                        <button
                          key={widget.title}
                          type="button"
                          disabled
                          className="flex min-h-[64px] items-start gap-3 rounded-xl border border-dashed border-border/50 bg-card/60 p-3 text-left opacity-75"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/60 text-muted-foreground">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">{widget.title}</span>
                            <span className="mt-1 block text-[11px] text-muted-foreground">{widget.desc}</span>
                            <span className="mt-2 inline-flex rounded-full border border-border/50 px-2 py-0.5 text-[10px] text-muted-foreground">Yakinda</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-border/50 bg-primary/5 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">Yeni bloklar kompakt halde eklenir. Duzenlemek icin karti acabilirsiniz.</p>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Plus className="h-3.5 w-3.5" />
            Hizli kurulum
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
