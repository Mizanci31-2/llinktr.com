import { BarChart3, CheckCircle2, GripVertical, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlockListPanelProps {
  totalBlocks: number;
  activeBlockCount: number;
  hiddenBlockCount: number;
  actionBlockCount: number;
  isSaving: boolean;
  isDirty: boolean;
  onSave: () => void;
  onOpenAddDialog: () => void;
  isDragging?: boolean;
  children: React.ReactNode;
}

export function BlockListPanel({
  totalBlocks,
  activeBlockCount,
  hiddenBlockCount,
  actionBlockCount,
  isSaving,
  isDirty,
  onSave,
  onOpenAddDialog,
  isDragging = false,
  children,
}: BlockListPanelProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-[#12161b] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Icerik bloklari</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Kartlar kompakt baslar. Ihtiyac oldugunda acip duzenlersiniz.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              totalBlocks >= 50 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
            }`}
          >
            <div
              className={`h-1.5 w-1.5 rounded-full ${
                totalBlocks >= 50 ? "bg-destructive" : "bg-primary"
              }`}
            />
            {totalBlocks}/50 oge
          </div>
          <Button
            type="button"
            size="sm"
            onClick={onOpenAddDialog}
            disabled={totalBlocks >= 50}
            className="bg-primary text-primary-foreground"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Yeni Oge Ekle
          </Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        <div className="rounded-xl border border-border/50 bg-[#1a1f25] p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Aktif</p>
          <p className="mt-1 text-2xl font-semibold">{activeBlockCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Yayinda gorunen bloklar</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-[#1a1f25] p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Gizli</p>
          <p className="mt-1 text-2xl font-semibold">{hiddenBlockCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Simdilik kapali duran bloklar</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-[#1a1f25] p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Aksiyon</p>
          <p className="mt-1 text-2xl font-semibold">{actionBlockCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Link ve sosyal ogeleri</p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-border/50 bg-[#181d22] p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            {isDragging ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
            ) : (
              <GripVertical className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            )}
            <p>
              {isDragging
                ? "Birakmak istediginiz kartin ustune gelin. Yer degisikligi hazir."
                : "Surukle-birak ile tasi, switch ile kapat, karti acip detaylari duzenle."}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={isSaving || !isDirty}
            className="w-full bg-primary text-primary-foreground sm:w-auto"
          >
            <Save className="mr-1.5 h-4 w-4" />
            Kaydet
          </Button>
        </div>
      </div>

      {children}
    </div>
  );
}
