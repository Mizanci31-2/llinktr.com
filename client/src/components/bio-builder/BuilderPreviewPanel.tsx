import { Eye, Monitor, Smartphone } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface BuilderPreviewPanelProps {
  previewMode: "phone" | "desktop";
  onPreviewModeChange: (value: "phone" | "desktop") => void;
  children: React.ReactNode;
}

export function BuilderPreviewPanel({
  previewMode,
  onPreviewModeChange,
  children,
}: BuilderPreviewPanelProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-border/60 bg-card/88 p-3 shadow-[0_14px_40px_rgba(0,0,0,0.18)] backdrop-blur sm:p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Canlı önizleme</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Profil, linkler ve sosyal bloklar burada anında yansır.
          </p>
        </div>
        <ToggleGroup
          type="single"
          value={previewMode}
          onValueChange={(value) => {
            if (value === "phone" || value === "desktop") {
              onPreviewModeChange(value);
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

      <div className="overflow-hidden rounded-2xl border border-border/40 bg-background/35 p-2 sm:p-4">
        {children}
      </div>
    </div>
  );
}
