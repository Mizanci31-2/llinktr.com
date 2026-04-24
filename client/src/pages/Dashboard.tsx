import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { getBioBackgroundStyle, getBioTheme, safeAccentColor } from "@/lib/constants";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import {
  Plus, Edit2, Trash2, Eye, ExternalLink,
  Globe, Loader2, LayoutDashboard, Link2, QrCode,
  MousePointerClick, PauseCircle, PlayCircle, UserRound
} from "lucide-react";

export default function Dashboard() {
  const MAX_BIO_PAGES = 5;
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [slugError, setSlugError] = useState("");

  const { data: pages, isLoading } = trpc.bioPages.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const pageCount = pages?.length ?? 0;
  const reachedPageLimit = pageCount >= MAX_BIO_PAGES;

  const { data: slugCheck } = trpc.bioPages.checkSlug.useQuery(
    { slug: newSlug },
    { enabled: newSlug.length >= 2 && /^[a-z0-9_-]+$/.test(newSlug) }
  );

  const createMutation = trpc.bioPages.create.useMutation({
    onSuccess: () => {
      setCreateOpen(false);
      setNewSlug("");
      setNewTitle("");
      toast.success("Bio sayfası oluşturuldu!");
      utils.bioPages.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Bir hata oluştu");
    },
  });

  const deleteMutation = trpc.bioPages.delete.useMutation({
    onSuccess: () => {
      utils.bioPages.list.invalidate();
      setDeleteId(null);
      toast.success("Bio sayfası silindi");
    },
    onError: (err) => toast.error(err.message),
  });

  const publishMutation = trpc.bioPages.update.useMutation({
    onSuccess: (_, variables) => {
      utils.bioPages.list.invalidate();
      toast.success(variables.isPublished ? "Sayfa yayına alındı" : "Sayfa yayını durduruldu");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: async (updatedUser) => {
      setProfileOpen(false);
      toast.success("Kullanıcı adı güncellendi");
      utils.auth.me.setData(undefined, updatedUser);
      await utils.auth.me.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Kullanıcı adı güncellenemedi");
    },
  });

  const handleSlugChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setNewSlug(clean);
    if (clean.length > 0 && clean.length < 2) {
      setSlugError("Slug en az 2 karakter olmalı");
    } else if (clean.length > 50) {
      setSlugError("Slug en fazla 50 karakter olabilir");
    } else {
      setSlugError("");
    }
  };

  const handleCreate = () => {
    if (reachedPageLimit) {
      toast.error(`Bir hesapta en fazla ${MAX_BIO_PAGES} bio sayfası açabilirsiniz`);
      return;
    }
    if (!newSlug || !newTitle) return;
    if (slugError) return;
    if (slugCheck && !slugCheck.available) {
      setSlugError("Bu slug zaten kullanılıyor");
      return;
    }
    createMutation.mutate({ slug: newSlug, title: newTitle });
  };

  const handleProfileSave = () => {
    const trimmedName = displayName.trim();
    if (trimmedName.length < 2) {
      toast.error("Kullanıcı adı en az 2 karakter olmalı");
      return;
    }

    updateProfileMutation.mutate({ name: trimmedName });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Giriş Yapın</h2>
            <p className="text-muted-foreground mb-6">Panele erişmek için giriş yapmanız gerekiyor.</p>
            <a href={getLoginUrl()}>
              <Button className="bg-primary text-primary-foreground">Giriş Yap</Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 container py-8">
        {/* Header */}
        <div className="mb-8 rounded-2xl border border-border/70 bg-card/70 px-4 py-4 panel-strong sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
            <h1 className="text-3xl font-bold">Panel</h1>
            <p className="text-muted-foreground mt-1">Hoş geldin, {user?.name || "kullanıcı"}</p>
            <p className="text-xs text-muted-foreground mt-2">{pageCount}/{MAX_BIO_PAGES} sayfa kullanılıyor</p>
            <p className="mt-2 inline-flex items-center rounded-full border border-primary/70 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">%100 ücretsiz</p>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2 sm:gap-3">
              <Button
                onClick={() => setCreateOpen(true)}
                disabled={reachedPageLimit}
                className="h-10 w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_oklch(0.93_0.23_110/0.25)] sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                {reachedPageLimit ? "Limit Doldu" : "Yeni Sayfa"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDisplayName(user?.name ?? "");
                  setProfileOpen(true);
                }}
                className="h-10 w-full border-border/60 sm:w-auto"
              >
                <UserRound className="h-4 w-4 mr-2" />
                Kullanıcı Adı
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Tools */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link href="/shortener">
            <div className="panel-strong group flex cursor-pointer items-center gap-4 rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-primary/40">
              <div className="h-10 w-10 rounded-lg bg-blue-400/10 flex items-center justify-center">
                <Link2 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Link Kısaltıcı</p>
                <p className="text-xs text-muted-foreground">Uzun URL'leri kısalt</p>
                <p className="text-[11px] text-primary font-medium mt-1">%100 ücretsiz</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
          <Link href="/qr">
            <div className="panel-strong group flex cursor-pointer items-center gap-4 rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-primary/40">
              <div className="h-10 w-10 rounded-lg bg-purple-400/10 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">QR Oluşturucu</p>
                <p className="text-xs text-muted-foreground">QR kod oluştur ve indir</p>
                <p className="text-[11px] text-primary font-medium mt-1">%100 ücretsiz</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        </div>

        {/* Bio Pages */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Bio Sayfalarım</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !pages || pages.length === 0 ? (
            <div className="panel-strong rounded-2xl border border-dashed border-border/70 py-16 text-center">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Henüz bio sayfanız yok</h3>
              <p className="text-muted-foreground text-sm mb-6">İlk bio sayfanızı oluşturun ve linklerinizi paylaşmaya başlayın.</p>
              <Button onClick={() => setCreateOpen(true)} className="bg-primary text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                İlk Sayfamı Oluştur
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pages.map((page) => {
                const theme = getBioTheme(page.theme);
                const accent = safeAccentColor(page.accentColor, theme.accent);

                return (
                <div key={page.id} className="panel-strong group rounded-2xl border border-border/70 bg-card p-5 transition-all hover:border-primary/40">
                  {/* Page header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{page.title}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">llinktr.com/p/{page.slug}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${page.isPublished ? "bg-primary" : "bg-muted-foreground"}`} />
                      <span className="text-xs text-muted-foreground">{page.isPublished ? "Yayında" : "Taslak"}</span>
                    </div>
                  </div>

                  {/* Theme preview */}
                  <div className="h-20 rounded-xl mb-4 flex items-center justify-center border border-border/30 overflow-hidden" style={getBioBackgroundStyle(theme, accent)}>
                    <div className="w-20 rounded-lg border p-2" style={{ background: theme.cardBg, borderColor: theme.cardBorder }}>
                      <div className="h-2 rounded-full mb-2" style={{ background: accent }} />
                      <div className="h-2 rounded-full bg-white/30 mb-1" />
                      <div className="h-2 rounded-full bg-white/20" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Eye className="h-3.5 w-3.5" />
                        Görüntülenme
                      </div>
                      <p className="text-lg font-bold">{page.views ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <MousePointerClick className="h-3.5 w-3.5" />
                        Tıklama
                      </div>
                      <p className="text-lg font-bold">{page.totalClicks ?? 0}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/builder/${page.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full border-border/50 text-xs">
                        <Edit2 className="h-3 w-3 mr-1.5" />
                        Düzenle
                      </Button>
                    </Link>
                    <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="border-border/50 text-xs">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border/50 text-xs"
                      disabled={publishMutation.isPending}
                      onClick={() => publishMutation.mutate({ id: page.id, isPublished: !page.isPublished })}
                    >
                      {page.isPublished ? <PauseCircle className="h-3 w-3 mr-1.5" /> : <PlayCircle className="h-3 w-3 mr-1.5" />}
                      {page.isPublished ? "Durdur" : "Yayınla"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border/50 text-destructive hover:text-destructive text-xs"
                      onClick={() => setDeleteId(page.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Create Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="bg-card border-border/50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kullanıcı Adını Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-xs uppercase tracking-wider text-muted-foreground">
                Kullanıcı Adı
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Görünecek kullanıcı adı"
                className="bg-input border-border/50 focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">Panelde ve karşılama alanında bu isim gösterilir.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileOpen(false)} className="border-border/50">
              İptal
            </Button>
            <Button
              onClick={handleProfileSave}
              disabled={updateProfileMutation.isPending || displayName.trim().length < 2 || displayName.trim() === (user?.name ?? "").trim()}
              className="bg-primary text-primary-foreground"
            >
              {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border/50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Bio Sayfası</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              Her hesapta en fazla {MAX_BIO_PAGES} bio sayfası açabilirsiniz.
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-xs uppercase tracking-wider text-muted-foreground">
                Slug (benzersiz URL)
              </Label>
              <div className="flex items-center gap-0">
                <span className="px-3 py-2 bg-muted rounded-l-lg border border-r-0 border-border/50 text-sm text-muted-foreground whitespace-nowrap">
                  llinktr.com/p/
                </span>
                <Input
                  id="slug"
                  value={newSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="kullanici-adi"
                  className="rounded-l-none bg-input border-border/50 focus:border-primary"
                />
              </div>
              {slugError && <p className="text-xs text-destructive">{slugError}</p>}
              {newSlug.length >= 2 && !slugError && slugCheck && (
                <p className={`text-xs ${slugCheck.available ? "text-primary" : "text-destructive"}`}>
                  {slugCheck.available ? "✓ Bu slug kullanılabilir" : "✗ Bu slug zaten alınmış"}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs uppercase tracking-wider text-muted-foreground">
                Sayfa Başlığı
              </Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Örn: Portfolyom"
                className="bg-input border-border/50 focus:border-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="border-border/50">
              İptal
            </Button>
            <Button
              onClick={handleCreate}
              disabled={reachedPageLimit || !newSlug || !newTitle || !!slugError || createMutation.isPending || (slugCheck !== undefined && !slugCheck.available)}
              className="bg-primary text-primary-foreground"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Bio sayfasını sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bio sayfası ve tüm içeriği kalıcı olarak silinecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50">İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

