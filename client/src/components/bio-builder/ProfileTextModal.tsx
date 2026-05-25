import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProfileTextModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

const BIO_LIMIT = 160;

export function ProfileTextModal({
  open,
  onOpenChange,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: ProfileTextModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/60 bg-[#111418] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Baslik ve biyografi</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Baslik</Label>
            <Input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Sayfa basligi"
              className="bg-input border-border/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Biyografi</Label>
              <span className="text-[11px] text-muted-foreground">{description.length}/{BIO_LIMIT}</span>
            </div>
            <Textarea
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value.slice(0, BIO_LIMIT))}
              placeholder="Kisa aciklama yazin"
              rows={4}
              className="resize-none bg-input border-border/50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border/50">
            Kapat
          </Button>
          <Button onClick={() => onOpenChange(false)} className="bg-primary text-primary-foreground">
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
