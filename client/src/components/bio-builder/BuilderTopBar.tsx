import { ArrowLeft, Eye, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface BuilderTopBarProps {
  title: string;
  slug: string;
  isPublished: boolean;
  isSaving: boolean;
  isDirty: boolean;
  onBack: () => void;
  onSave: () => void;
  onTogglePublished: (checked: boolean) => void;
}

export function BuilderTopBar({
  title,
  slug,
  isPublished,
  isSaving,
  isDirty,
  onBack,
  onSave,
  onTogglePublished,
}: BuilderTopBarProps) {
  return (
    <div className="sticky top-16 z-40 border-b border-border/50 bg-[#0d0f12]/85 backdrop-blur-xl">
      <div className="container flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-9 flex-shrink-0 px-2 text-xs text-muted-foreground sm:px-3 sm:text-sm"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Panel
          </Button>
          <div className="hidden h-4 w-px bg-border sm:block" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-white">{title}</h1>
            <p className="truncate text-xs text-muted-foreground">llinktr.com/{slug}</p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-3 py-1.5">
            <span className="text-xs text-muted-foreground">
              {isPublished ? "Yayında" : "Durduruldu"}
            </span>
            <Switch checked={isPublished} onCheckedChange={onTogglePublished} className="scale-75" />
          </div>

          <a href={`/${slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-9 border-border/50 px-3 text-xs">
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Görüntüle
            </Button>
          </a>

          <Button
            size="sm"
            onClick={onSave}
            disabled={isSaving || !isDirty}
            className="h-9 bg-primary px-3 text-xs text-primary-foreground shadow-[0_0_18px_rgba(214,255,0,0.24)]"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Kaydet
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
