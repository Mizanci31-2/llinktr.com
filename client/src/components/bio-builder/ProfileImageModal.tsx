import { ExternalLink, ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_CANVA_PROFILE_URL } from "./utils";

interface ProfileImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageSelect: (file?: File) => void;
  canvaUrl?: string;
}

export function ProfileImageModal({
  open,
  onOpenChange,
  onImageSelect,
  canvaUrl = DEFAULT_CANVA_PROFILE_URL,
}: ProfileImageModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/60 bg-[#111418] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Profil medyasi</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="rounded-2xl border border-border/60 bg-[#161b20] p-4">
            <div className="mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">Resim veya GIF sec</p>
                <p className="text-[11px] text-muted-foreground">Onerilen boyut 800 x 800 px, 1:1 kare.</p>
              </div>
            </div>
            <Input
              type="file"
              accept="image/*,image/gif"
              onChange={(event) => {
                onImageSelect(event.currentTarget.files?.[0]);
                event.currentTarget.value = "";
              }}
              className="bg-input border-border/50 text-xs"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              PNG, JPG, WebP veya GIF yukleyebilirsiniz. Maksimum 7 MB.
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-[#161b20] p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00C4CC] text-lg font-black text-white shadow-[0_0_18px_rgba(0,196,204,0.25)]">
                Ca
              </div>
              <div>
                <p className="text-sm font-semibold">Canva ile tasarla</p>
                <p className="text-[11px] text-muted-foreground">Yeni sekmede Canva acilir.</p>
              </div>
            </div>
            <a href={canvaUrl} target="_blank" rel="noopener noreferrer">
              <Button type="button" variant="outline" className="w-full border-border/50 bg-background/40">
                Canva'yi ac
                <ExternalLink className="ml-1.5 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
