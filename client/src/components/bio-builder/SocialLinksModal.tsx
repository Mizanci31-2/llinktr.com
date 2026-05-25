import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SOCIAL_PLATFORMS } from "@/lib/constants";
import { SocialIcon } from "@/components/SocialIcon";
import type { SocialLinkDraft } from "./types";

interface SocialLinksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SocialLinkDraft[];
  onItemsChange: (items: SocialLinkDraft[]) => void;
  onAdd: () => void;
}

export function SocialLinksModal({
  open,
  onOpenChange,
  items,
  onItemsChange,
  onAdd,
}: SocialLinksModalProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!items.length) {
      setActiveId(null);
      return;
    }
    setActiveId((prev) => (prev && items.some((item) => item.id === prev) ? prev : items[0].id));
  }, [items]);

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) ?? items[0] ?? null,
    [activeId, items],
  );

  const updateItem = (id: string, patch: Partial<SocialLinkDraft>) => {
    onItemsChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id: string) => {
    onItemsChange(items.filter((item) => item.id !== id));
    if (activeId === id) {
      const next = items.find((item) => item.id !== id);
      setActiveId(next?.id ?? null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/60 bg-[#111418] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Sosyal medya paneli</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-[#151a20] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Ust alanda gorunen sosyal hesaplar</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Yeni hesap ekledikce saga dogru acilir. Sayfanin ust kismina bu sirayla yerlesir.
                </p>
              </div>
              <Button variant="outline" onClick={onAdd} className="border-dashed border-border/50">
                <Plus className="mr-1.5 h-4 w-4" />
                Yeni sosyal medya ekle
              </Button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1">
              {items.map((item, index) => {
                const platform = SOCIAL_PLATFORMS.find((entry) => entry.id === item.platform);
                const isActive = item.id === activeItem?.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveId(item.id)}
                    className={`min-w-[112px] rounded-2xl border p-3 text-left transition ${
                      isActive ? "border-primary bg-primary/10" : "border-border/60 bg-background/55 hover:border-primary/35"
                    }`}
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-[#1b222a]">
                      <SocialIcon platform={item.platform} size={22} color={platform?.color || "#D6FF00"} />
                    </div>
                    <p className="truncate text-sm font-semibold text-white">
                      {platform?.label || `Sosyal ${index + 1}`}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">
                      {item.url || "Baglanti bekleniyor"}
                    </p>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={onAdd}
                className="flex min-w-[112px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/40 p-3 text-center transition hover:border-primary/35"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-[#1b222a]">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-semibold">Yeni sosyal medya</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Yeni ikon ekle</p>
              </button>
            </div>
          </div>

          {activeItem ? (
            <div className="rounded-2xl border border-border/60 bg-[#151a20] p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Secili sosyal hesap</p>
                  <p className="mt-1 text-xs text-muted-foreground">Platformu secin, baglantiyi yapistirin ve isterseniz yenisini ekleyin.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={activeItem.isEnabled}
                    onCheckedChange={(checked) => updateItem(activeItem.id, { isEnabled: checked })}
                    className="scale-75"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(activeItem.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Platform</Label>
                  <Select value={activeItem.platform} onValueChange={(value) => updateItem(activeItem.id, { platform: value })}>
                    <SelectTrigger className="bg-input border-border/50">
                      <SelectValue placeholder="Platform secin" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOCIAL_PLATFORMS.map((platform) => (
                        <SelectItem key={platform.id} value={platform.id}>
                          <div className="flex items-center gap-2">
                            <SocialIcon platform={platform.id} size={16} color={platform.color} />
                            <span>{platform.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Baglanti</Label>
                  <Input
                    value={activeItem.url}
                    onChange={(event) => updateItem(activeItem.id, { url: event.target.value })}
                    placeholder={SOCIAL_PLATFORMS.find((platform) => platform.id === activeItem.platform)?.placeholder || "https://..."}
                    className="bg-input border-border/50"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 px-4 py-8 text-center">
              <p className="text-sm font-medium">Henuz sosyal hesap yok</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Yeni sosyal medya ekle diyerek ust kisim ikonlarini olusturabilirsiniz.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onAdd} className="w-full border-dashed border-border/50 sm:w-auto">
            <Plus className="mr-1.5 h-4 w-4" />
            Yeni sosyal medya ekle
          </Button>
          <Button onClick={() => onOpenChange(false)} className="w-full bg-primary text-primary-foreground sm:w-auto">
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
