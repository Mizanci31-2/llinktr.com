import { ChevronDown, Image as ImageIcon, MessageCircle, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ThemePanelCardProps {
  themeLabel: string;
  themePreviewStyle: React.CSSProperties;
  accentColor: string;
  textColor: string;
  palettes: Array<{ label: string; accent: string; text: string }>;
  customBackgroundImageUrl: string;
  onOpenThemeDialog: () => void;
  onAccentChange: (value: string) => void;
  onTextColorChange: (value: string) => void;
  onApplyPalette: (accent: string, text: string) => void;
  onBackgroundUpload: (file?: File) => void;
  onClearBackground: () => void;
}

export function ThemePanelCard({
  themeLabel,
  themePreviewStyle,
  accentColor,
  textColor,
  palettes,
  customBackgroundImageUrl,
  onOpenThemeDialog,
  onAccentChange,
  onTextColorChange,
  onApplyPalette,
  onBackgroundUpload,
  onClearBackground,
}: ThemePanelCardProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/90 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
      <div className="mb-4 flex items-center gap-2">
        <Palette className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Tema ve renk</h2>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-primary/25 bg-[#182029] p-4 shadow-[0_0_0_1px_rgba(214,255,0,0.05),0_16px_36px_rgba(0,0,0,0.2)]">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tema secimi</Label>
          <button
            type="button"
            onClick={onOpenThemeDialog}
            className="mt-2 w-full rounded-2xl border border-primary/20 bg-[#0d1116] px-4 py-4 text-left transition-colors hover:border-primary/60 hover:bg-primary/5"
          >
            <div className="flex items-center gap-3">
              <div className="h-14 w-24 rounded-xl border border-border/50 shadow-inner" style={themePreviewStyle} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight">Temalari ac</p>
                <p className="truncate text-xs text-muted-foreground">Secili tema: {themeLabel}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        </div>

        <div className="rounded-2xl border border-border/50 bg-[#161b21] p-4">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Vurgu rengi</Label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              value={accentColor}
              onChange={(event) => onAccentChange(event.target.value)}
              className="h-11 w-14 cursor-pointer rounded-xl border border-border/50 bg-transparent"
            />
            <Input
              value={accentColor}
              onChange={(event) => onAccentChange(event.target.value)}
              placeholder="#22D3EE"
              className="bg-input border-border/50 font-mono text-sm"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Vurgu rengi buton, ikon, border ve aktif alanlarda kullanilir.
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-[#161b21] p-4">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Yazi rengi</Label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              value={textColor}
              onChange={(event) => onTextColorChange(event.target.value)}
              className="h-11 w-14 cursor-pointer rounded-xl border border-border/50 bg-transparent"
            />
            <Input
              value={textColor}
              onChange={(event) => onTextColorChange(event.target.value)}
              placeholder="#F8FAFC"
              className="bg-input border-border/50 font-mono text-sm"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Profil basligi, biyografi ve metin bloklari bu ana yazi rengini kullanir.
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-[#161b21] p-4">
          <div className="mb-3 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Hazir paletler</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {palettes.map((palette) => (
              <button
                key={palette.label}
                type="button"
                onClick={() => onApplyPalette(palette.accent, palette.text)}
                className="flex items-center gap-2 rounded-lg border border-border/50 bg-input px-2.5 py-2 text-xs transition-colors hover:border-primary/50"
              >
                <span className="h-4 w-4 rounded-full border border-white/20" style={{ background: palette.accent }} />
                {palette.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-[#161b21] p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Fotograf temasi
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Onerilen: 1080x1920 veya 1920x1080, maksimum 7 MB
              </p>
            </div>
            {customBackgroundImageUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={onClearBackground} className="h-8 text-xs text-muted-foreground">
                Kaldir
              </Button>
            )}
          </div>
          <Input
            type="file"
            accept="image/*"
            onChange={(event) => {
              onBackgroundUpload(event.currentTarget.files?.[0]);
              event.currentTarget.value = "";
            }}
            className="bg-input border-border/50 text-xs"
          />
          {customBackgroundImageUrl ? (
            <div
              className="mt-3 h-24 rounded-xl border border-border/50 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.18), rgba(0,0,0,0.36)), url(${customBackgroundImageUrl})`,
              }}
            />
          ) : (
            <div className="mt-3 flex h-24 items-center justify-center rounded-xl border border-dashed border-border/40 bg-background/30 text-xs text-muted-foreground">
              <ImageIcon className="mr-1.5 h-4 w-4" />
              Fotograf eklerseniz burada onizlenir
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
