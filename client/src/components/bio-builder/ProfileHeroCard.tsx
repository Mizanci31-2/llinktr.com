import { ChevronDown, ImagePlus, MessageCircle, Share2, Upload, UserRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SocialIcon } from "@/components/SocialIcon";
import type { SocialLinkDraft } from "./types";
import { isVideoMediaUrl } from "./utils";

interface ProfileHeroCardProps {
  title: string;
  description: string;
  profileImageUrl: string;
  faviconUrl: string;
  socialItems: SocialLinkDraft[];
  onOpenMedia: () => void;
  onOpenText: () => void;
  onOpenSocial: () => void;
  onFaviconSelect: (file?: File) => void;
}

type PanelKey = "media" | "text" | "social";

function QuickPanel({
  title,
  description,
  icon,
  open,
  onToggle,
  onAction,
  actionLabel,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  onAction: () => void;
  actionLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-[#12171d] shadow-[0_8px_28px_rgba(0,0,0,0.18)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-[#171d24] text-primary">
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-[11px] text-muted-foreground">{description}</p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="border-t border-border/60 bg-[#0f1419] px-4 py-3">
          <Button onClick={onAction} variant="outline" className="w-full justify-start border-border/60 bg-background/50 font-semibold">
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function ProfileHeroCard({
  title,
  description,
  profileImageUrl,
  faviconUrl,
  socialItems,
  onOpenMedia,
  onOpenText,
  onOpenSocial,
  onFaviconSelect,
}: ProfileHeroCardProps) {
  const [openPanel, setOpenPanel] = useState<PanelKey | null>("media");
  const enabledSocials = socialItems.filter((item) => item.isEnabled && item.url).slice(0, 8);

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-[linear-gradient(180deg,rgba(17,20,24,0.98),rgba(9,11,14,0.98))] p-5 shadow-[0_18px_54px_rgba(0,0,0,0.32)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex w-[128px] flex-shrink-0 flex-col items-start gap-3">
            <button
              type="button"
              onClick={onOpenMedia}
              className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.2rem] border border-primary/25 bg-background/60 text-muted-foreground transition hover:border-primary/45 hover:bg-primary/5"
            >
              {profileImageUrl ? (
                isVideoMediaUrl(profileImageUrl) ? (
                  <video
                    src={profileImageUrl}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    autoPlay
                    loop
                  />
                ) : (
                  <img src={profileImageUrl} alt="Profil medyasi" className="h-full w-full object-cover" />
                )
              ) : (
                <UserRound className="h-9 w-9" />
              )}
            </button>

            <div className="w-full rounded-2xl border border-border/60 bg-[#171b20] p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/70">
                  {faviconUrl ? (
                    <img src={faviconUrl} alt="Sekme logosu" className="h-7 w-7 rounded-md object-cover" />
                  ) : (
                    <ImagePlus className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white">Sekme logosu</p>
                  <p className="text-[10px] text-muted-foreground">1:1 kare</p>
                </div>
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  onFaviconSelect(event.currentTarget.files?.[0]);
                  event.currentTarget.value = "";
                }}
                className="h-9 bg-background/60 text-[11px]"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <button type="button" onClick={onOpenText} className="w-full text-left">
              <div className="inline-flex max-w-full items-center gap-2 rounded-2xl bg-[#151b22] px-4 py-2">
                <h2 className="truncate text-[1.85rem] font-semibold leading-none text-white">
                  {title || "Baslik ekleyin"}
                </h2>
                <Badge variant="secondary" className="border border-border/50 bg-black/30 text-[11px]">
                  Profil alani
                </Badge>
              </div>
              <p className="mt-3 max-w-2xl rounded-xl bg-[#10151a] px-3 py-2 text-sm leading-relaxed text-muted-foreground">
                {description || "Biyografinizi ekleyin. Bu alan sayfanizin ilk izlenimini belirler."}
              </p>
            </button>

            <div className="mt-5 rounded-2xl border border-border/60 bg-[#10151a] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Sosyal medya alani
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Buradaki ikonlar sosyal medya panelinden eklenen hesaplari sayfanin ust kismina yerlestirir.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {enabledSocials.length > 0 ? (
                  enabledSocials.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={onOpenSocial}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background/60 transition hover:border-primary/40"
                    >
                      <SocialIcon platform={item.platform} size={18} />
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    onClick={onOpenSocial}
                    className="rounded-full border border-dashed border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  >
                    Sosyal medya ekle
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-2.5 lg:w-[340px]">
          <QuickPanel
            title="Profil medyasi"
            description="Logo ve sekme gorseli"
            icon={<Upload className="h-4 w-4" />}
            open={openPanel === "media"}
            onToggle={() => setOpenPanel((prev) => (prev === "media" ? null : "media"))}
            onAction={onOpenMedia}
            actionLabel="Medyayi duzenle"
          />
          <QuickPanel
            title="Baslik ve biyografi"
            description="Kullanici adi ve aciklama"
            icon={<MessageCircle className="h-4 w-4" />}
            open={openPanel === "text"}
            onToggle={() => setOpenPanel((prev) => (prev === "text" ? null : "text"))}
            onAction={onOpenText}
            actionLabel="Metin alanini duzenle"
          />
          <QuickPanel
            title="Sosyal medya"
            description="Uste cikacak ikonlari yonet"
            icon={<Share2 className="h-4 w-4" />}
            open={openPanel === "social"}
            onToggle={() => setOpenPanel((prev) => (prev === "social" ? null : "social"))}
            onAction={onOpenSocial}
            actionLabel="Sosyal medya panelini ac"
          />
        </div>
      </div>
    </div>
  );
}
