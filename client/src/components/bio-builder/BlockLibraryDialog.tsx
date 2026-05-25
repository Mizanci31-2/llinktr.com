import { Search, Store, MapPin, Plus, Sparkles, Shapes } from "lucide-react";
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

export function BlockLibraryDialog({
  open,
  onOpenChange,
  onAddBlock,
  onAddCommerce,
  onAddLocation,
  disabled = false,
}: BlockLibraryDialogProps) {
  const [query, setQuery] = useState("");

  const filteredBlocks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return BLOCK_TYPES;
    return BLOCK_TYPES.filter(
      (item) =>
        item.label.toLowerCase().includes(normalized) ||
        item.desc.toLowerCase().includes(normalized),
    );
  }, [query]);

  const filteredCommerce = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return COMMERCE_LINK_PRESETS;
    return COMMERCE_LINK_PRESETS.filter((item) => item.label.toLowerCase().includes(normalized));
  }, [query]);

  const filteredLocations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return LOCATION_LINK_PRESETS;
    return LOCATION_LINK_PRESETS.filter((item) => item.label.toLowerCase().includes(normalized));
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[96svh] w-[calc(100vw-1rem)] overflow-hidden border-border/60 bg-[#111418] p-0 sm:h-auto sm:max-h-[88vh] sm:max-w-[1080px]">
        <DialogHeader className="border-b border-border/60 px-5 pb-4 pt-5">
          <DialogTitle>Yeni Oge Ekle</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col sm:max-h-[78vh]">
          <div className="border-b border-border/50 px-5 py-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Blok, platform veya baglanti turu ara"
                className="bg-input border-border/50 pl-9"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
            <div className="grid min-h-full items-stretch gap-4 lg:grid-cols-[minmax(220px,0.85fr)_minmax(320px,1.2fr)_minmax(260px,0.95fr)]">
              <section className="rounded-2xl border border-border/60 bg-background/45 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Temel bloklar</h3>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  {filteredBlocks.map((blockType) => (
                    <button
                      key={blockType.type}
                      type="button"
                      disabled={disabled}
                      onClick={() => onAddBlock(blockType.type as BlockType)}
                      className="rounded-xl border border-border/50 bg-card/80 p-3 text-left transition hover:border-primary/45 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <p className="text-sm font-medium">{blockType.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{blockType.desc}</p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="flex min-h-0 flex-col rounded-2xl border border-border/60 bg-background/45 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Hazir e-ticaret</h3>
                </div>
                <div className="grid min-h-0 flex-1 max-h-[42vh] gap-2 overflow-y-auto pr-1 lg:max-h-[520px]">
                  {filteredCommerce.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => onAddCommerce(preset.id)}
                      className="flex min-h-[64px] items-center gap-3 rounded-xl border border-border/50 bg-card/80 p-3 text-left transition hover:border-primary/45 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <img src={preset.logoUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{preset.label}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {preset.placeholder.replace("https://", "")}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <div className="grid min-h-0 gap-4">
                <section className="rounded-2xl border border-border/60 bg-background/45 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Hazir konum linkleri</h3>
                  </div>
                  <div className="grid max-h-[240px] gap-2 overflow-y-auto pr-1">
                    {filteredLocations.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => onAddLocation(preset.id)}
                        className="flex min-h-[64px] items-center gap-3 rounded-xl border border-border/50 bg-card/80 p-3 text-left transition hover:border-primary/45 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <img src={preset.logoUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{preset.label}</p>
                          <p className="truncate text-[11px] text-muted-foreground">Harita baglantisi</p>
                        </div>
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
                    {[
                      { title: "Embed karti", desc: "YouTube, Spotify veya ozel gomme alani" },
                      { title: "Takvim / randevu", desc: "Takvim baglantisi veya rezervasyon alani" },
                      { title: "Form / toplama", desc: "Lead veya iletisim toplama karti" },
                    ].map((widget) => (
                      <div
                        key={widget.title}
                        className="rounded-xl border border-dashed border-border/50 bg-card/60 p-3 text-left opacity-75"
                      >
                        <p className="text-sm font-medium">{widget.title}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{widget.desc}</p>
                        <p className="mt-2 inline-flex rounded-full border border-border/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                          Yakinda
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-border/50 bg-primary/5 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Yeni bloklar kompakt halde eklenir. Duzenlemek icin karti sonra acarsiniz.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <Plus className="h-3.5 w-3.5" />
              Hizli kurulum
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
