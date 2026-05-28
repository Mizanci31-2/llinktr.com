import { useMemo, useState } from "react";
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
import { PageAnalyticsDialog } from "@/components/dashboard/PageAnalyticsDialog";
import { toast } from "sonner";
import {
  Activity, Plus, Edit2, Trash2, Eye, ExternalLink,
  Globe, Loader2, LayoutDashboard, Link2, QrCode,
  Clock3, MousePointerClick, PauseCircle, PlayCircle, UserRound, Trophy, BarChart3, Search, Users, TrendingUp, FileText
} from "lucide-react";


type DashboardActivityItem = {
  label: string;
  value: string;
  icon: typeof Activity;
};

function DashboardActivityCard({ items }: { items: DashboardActivityItem[] }) {
  const hasActivity = items.some((item) => item.value !== "Veri yok" && item.value !== "0");
  const primaryItems = items.slice(0, 2);
  const detailItems = items.slice(2);

  return (
    <aside className="panel-strong rounded-3xl border border-primary/20 bg-[linear-gradient(145deg,rgba(214,255,0,0.08),rgba(18,24,32,0.96))] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.22)] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold">
            <Activity className="h-4 w-4 text-primary" />
            Canli durum
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Bugunun verileri ve son sayfa sinyalleri.</p>
        </div>
        <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_18px_rgba(214,255,0,0.65)]" />
      </div>

      {!hasActivity ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-background/35 p-4 text-sm text-muted-foreground">Henuz aktivite yok</div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {primaryItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-primary/20 bg-primary/10 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="truncate text-[11px] text-muted-foreground">{item.label}</p>
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                  </div>
                  <p className="truncate text-2xl font-black text-primary">{item.value}</p>
                </div>
              );
            })}
          </div>
          <div className="grid gap-2">
            {detailItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">{item.label}</p>
                    <p className="truncate text-sm font-semibold">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
export default function Dashboard() {
  const MAX_BIO_PAGES = 5;
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [analyticsPageId, setAnalyticsPageId] = useState<number | null>(null);
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [slugError, setSlugError] = useState("");

  const { data: pages, isLoading } = trpc.bioPages.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
  const pageCount = pages?.length ?? 0;
  const totalViews = pages?.reduce((sum, page) => sum + (page.views ?? 0), 0) ?? 0;
  const totalClicks = pages?.reduce((sum, page) => sum + (page.totalClicks ?? 0), 0) ?? 0;
  const todayClicks = pages?.reduce((sum, page) => sum + (page.todayClicks ?? 0), 0) ?? 0;
  const todayViews = pages?.reduce((sum, page) => sum + (page.todayViews ?? 0), 0) ?? 0;
  const bestPage = pages?.slice().sort((a, b) => (b.totalClicks ?? 0) - (a.totalClicks ?? 0))[0];
  const activePages = pages?.filter((page) => page.isPublished).length ?? 0;
  const dailyChange = totalViews > 0 ? Math.round(((todayViews + todayClicks) / Math.max(totalViews + totalClicks, 1)) * 100) : 0;
  const chartValues = todayClicks === 0
    ? Array.from({ length: 7 }, () => 6)
    : [32, 46, 38, 58, 48, 72, Math.max(28, Math.min(92, todayClicks + 28))];
  const reachedPageLimit = pageCount >= MAX_BIO_PAGES;
  const analyticsPage = pages?.find((page) => page.id === analyticsPageId) ?? null;
  const [pageSearch, setPageSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [sortBy, setSortBy] = useState<"created" | "views" | "clicks" | "title">("created");
  const [tablePage, setTablePage] = useState(1);
  const pageSize = 6;
  const metricCards = [
    { label: "Toplam goruntulenme", value: totalViews, icon: Eye, note: "Tum sayfalar", bars: [24, 32, 38, 46, 54, 62, 72] },
    { label: "En iyi link", value: bestPage?.title || "Yok", icon: Trophy, note: bestPage ? `${bestPage.totalClicks ?? 0} tiklama` : "Ilk sayfani olustur", bars: [20, 28, 36, 48, 62, 78, 92] },
    { label: "Toplam link sayfasi", value: pageCount, icon: FileText, note: `${MAX_BIO_PAGES} sayfa limitinden`, bars: [12, 18, 24, 36, 48, 58, 66] },
    { label: "Aktif kullanici", value: activePages, icon: Users, note: "Yayindaki sayfalar", bars: [14, 22, 34, 38, 46, 54, 64] },
    { label: "Gunluk degisim", value: `%${dailyChange}`, icon: TrendingUp, note: "Bugun / toplam oran", bars: [18, 20, 26, 34, 44, 52, Math.max(18, Math.min(92, dailyChange + 18))] },
  ];
  const filteredPages = useMemo(() => {
    const query = pageSearch.trim().toLocaleLowerCase("tr-TR");
    return [...(pages ?? [])]
      .filter((page) => {
        const matchesStatus = statusFilter === "all" || (statusFilter === "published" ? page.isPublished : !page.isPublished);
        const matchesQuery = !query || `${page.title} ${page.slug}`.toLocaleLowerCase("tr-TR").includes(query);
        return matchesStatus && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === "views") return (b.views ?? 0) - (a.views ?? 0);
        if (sortBy === "clicks") return (b.totalClicks ?? 0) - (a.totalClicks ?? 0);
        if (sortBy === "title") return String(a.title).localeCompare(String(b.title), "tr");
        return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      });
  }, [pageSearch, pages, sortBy, statusFilter]);
  const totalTablePages = Math.max(1, Math.ceil(filteredPages.length / pageSize));
  const visibleTablePages = filteredPages.slice((tablePage - 1) * pageSize, tablePage * pageSize);
  const latestPage = pages?.slice().sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())[0];
  const activityItems: DashboardActivityItem[] = [
    { label: "Bugunku goruntuleme", value: String(todayViews), icon: Eye },
    { label: "Bugunku tiklama", value: String(todayClicks), icon: MousePointerClick },
    { label: "Son olusturulan bio", value: latestPage?.title || "Veri yok", icon: Link2 },
    { label: "En iyi sayfa", value: bestPage?.title || "Veri yok", icon: Trophy },
    { label: "Yayindaki sayfa", value: String(activePages), icon: Users },
    { label: "Son guncelleme", value: latestPage?.createdAt ? new Date(latestPage.createdAt).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Veri yok", icon: Clock3 },
  ];

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
        <div className="mb-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] px-4 py-5 panel-strong sm:px-6">
            <div className="flex flex-col gap-5">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Panel ozeti
                </div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Hos geldin, {user?.name || "kullanici"}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">Bugunun ozeti hazir. En hizli aksiyon: bio sayfani duzenle, yayina al ve performansi takip et.</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-primary/45 bg-primary/10 px-2.5 py-1 font-semibold text-primary">%100 ucretsiz</span>
                  <span className="rounded-full border border-border/60 bg-background/40 px-2.5 py-1">{pageCount}/{MAX_BIO_PAGES} sayfa</span>
                  <span className="rounded-full border border-border/60 bg-background/40 px-2.5 py-1">Kredi karti gerekmez</span>
                </div>
              </div>
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:max-w-md">
                <Button
                  onClick={() => setCreateOpen(true)}
                  disabled={reachedPageLimit}
                  className="h-11 w-full bg-primary font-bold text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_oklch(0.93_0.23_110/0.25)]"
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
                  className="h-11 w-full border-border/60"
                >
                  <UserRound className="h-4 w-4 mr-2" />
                  Kullanici Adi
                </Button>
              </div>
            </div>
          </section>
          <DashboardActivityCard items={activityItems} />
        </div>
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {metricCards.map((card, cardIndex) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="panel-strong rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(18,24,32,0.98),rgba(12,14,16,0.96))] p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="min-w-0 text-sm text-muted-foreground">{card.label}</p>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </span>
                </div>
                <p className="truncate text-3xl font-black tracking-tight sm:text-4xl">{card.value}</p>
                <p className="mt-2 truncate text-xs text-muted-foreground">{card.note}</p>
                <div className="mt-5 flex h-10 items-end gap-1.5">
                  {card.bars.map((value, index) => (
                    <span key={`${card.label}-${index}`} className="mini-chart-bar flex-1 rounded-t bg-primary/80" style={{ height: `${value}%`, animationDelay: `${(index + cardIndex) * 45}ms` }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden">
          <div className="panel-strong rounded-2xl border border-white/10 bg-[#121820] p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Bugün tıklama</p>
              <MousePointerClick className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{todayClicks}</p>
            <div className="mt-5 flex h-16 items-end gap-1.5">
              {chartValues.map((value, index) => (
                <span key={index} className="mini-chart-bar flex-1 rounded-t bg-primary/80" style={{ height: `${value}%`, animationDelay: `${index * 70}ms` }} />
              ))}
            </div>
          </div>
          <div className="panel-strong rounded-2xl border border-white/10 bg-[#121820] p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Bugün görüntüleme</p>
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{todayViews}</p>
            <p className="mt-5 text-sm text-muted-foreground">Bugün bio sayfalarının aldığı görüntüleme.</p>
          </div>
          <div className="panel-strong rounded-2xl border border-white/10 bg-[#121820] p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Toplam görüntülenme</p>
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{totalViews}</p>
            <p className="mt-5 text-sm text-muted-foreground">Tüm bio sayfalarının toplam görünürlüğü.</p>
          </div>
          <div className="panel-strong rounded-2xl border border-white/10 bg-[#121820] p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">En iyi link</p>
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <p className="truncate text-xl font-bold">{bestPage?.title || "İlk sayfanı oluştur"}</p>
            <p className="mt-2 text-sm text-muted-foreground">{bestPage ? `${bestPage.totalClicks ?? 0} tıklama ile önde` : "Değer görmek için bio sayfanı yayına al."}</p>
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

        <section className="mb-8 rounded-2xl border border-white/10 bg-card/95 p-4 panel-strong sm:p-5">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Sayfa performansi</h2>
              <p className="mt-1 text-sm text-muted-foreground">Link sayfalarini ara, filtrele ve hizli karsilastir.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_150px_150px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={pageSearch} onChange={(event) => { setPageSearch(event.target.value); setTablePage(1); }} placeholder="Sayfa ara" className="h-10 bg-input pl-9" />
              </div>
              <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setTablePage(1); }} className="h-10 rounded-md border border-border bg-input px-3 text-sm">
                <option value="all">Tum durumlar</option>
                <option value="published">Yayinda</option>
                <option value="draft">Taslak</option>
              </select>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="h-10 rounded-md border border-border bg-input px-3 text-sm">
                <option value="created">Tarihe gore</option>
                <option value="views">Goruntulenme</option>
                <option value="clicks">Tiklama</option>
                <option value="title">Ada gore</option>
              </select>
            </div>
          </div>

          {filteredPages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-background/45 py-10 text-center">
              <Globe className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">Bu filtreyle sayfa bulunamadi</p>
              <p className="mt-1 text-sm text-muted-foreground">Aramayi veya filtreyi degistirin.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-border/60 md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.035] text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Link adi</th>
                      <th className="px-4 py-3">Goruntuleme</th>
                      <th className="px-4 py-3">Tiklama</th>
                      <th className="px-4 py-3">Tarih</th>
                      <th className="px-4 py-3">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {visibleTablePages.map((page) => (
                      <tr key={page.id} className="bg-background/30 transition-colors hover:bg-primary/5">
                        <td className="px-4 py-3">
                          <p className="font-semibold">{page.title}</p>
                          <p className="text-xs text-muted-foreground">llinktr.com/{page.slug}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold">{page.views ?? 0}</td>
                        <td className="px-4 py-3 font-semibold">{page.totalClicks ?? 0}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(page.createdAt ?? Date.now()).toLocaleDateString("tr-TR")}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${page.isPublished ? "bg-primary/10 text-primary" : "bg-white/10 text-muted-foreground"}`}>
                            {page.isPublished ? "Yayinda" : "Taslak"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 md:hidden">
                {visibleTablePages.map((page) => (
                  <article key={page.id} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{page.title}</h3>
                        <p className="truncate text-xs text-muted-foreground">llinktr.com/{page.slug}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${page.isPublished ? "bg-primary/10 text-primary" : "bg-white/10 text-muted-foreground"}`}>
                        {page.isPublished ? "Yayinda" : "Taslak"}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-xl bg-white/[0.04] p-2"><b className="block text-base">{page.views ?? 0}</b>Gor.</div>
                      <div className="rounded-xl bg-white/[0.04] p-2"><b className="block text-base">{page.totalClicks ?? 0}</b>Tik.</div>
                      <div className="rounded-xl bg-white/[0.04] p-2"><b className="block text-base">{new Date(page.createdAt ?? Date.now()).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })}</b>Tarih</div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">{filteredPages.length} kayit icinden {visibleTablePages.length} gosteriliyor.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={tablePage <= 1} onClick={() => setTablePage((current) => Math.max(1, current - 1))}>Onceki</Button>
                  <span className="flex min-w-16 items-center justify-center rounded-md border border-border px-3 text-xs">{tablePage}/{totalTablePages}</span>
                  <Button variant="outline" size="sm" disabled={tablePage >= totalTablePages} onClick={() => setTablePage((current) => Math.min(totalTablePages, current + 1))}>Sonraki</Button>
                </div>
              </div>
            </>
          )}
        </section>

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
                const pageBars = (page.todayClicks ?? 0) === 0 && (page.todayViews ?? 0) === 0
                  ? Array.from({ length: 7 }, () => 16)
                  : [18, 24, 21, 32, 28, 36, Math.min(86, 22 + (page.todayClicks ?? 0) * 6 + (page.todayViews ?? 0) * 2)];

                return (
                <div key={page.id} className="panel-strong group rounded-2xl border border-border/70 bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_0_34px_rgba(214,255,0,0.08)]">
                  {/* Page header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{page.title}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">llinktr.com/{page.slug}</span>
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

                  <div className="mb-4 flex h-12 items-end gap-1.5 rounded-xl border border-border/30 bg-background/35 px-3 py-2">
                    {pageBars.map((value, index) => (
                      <span
                        key={index}
                        className="mini-chart-bar flex-1 rounded-t bg-primary/75"
                        style={{ height: `${value}%`, animationDelay: `${index * 60}ms` }}
                      />
                    ))}
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
                      <Button variant="outline" size="sm" className="w-full border-white/12 bg-white/[0.035] text-xs hover:border-primary/45 hover:bg-primary/10">
                        <Edit2 className="h-3 w-3 mr-1.5" />
                        Düzenle
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/12 bg-white/[0.035] text-xs hover:border-primary/45 hover:bg-primary/10"
                      onClick={() => setAnalyticsPageId(page.id)}
                    >
                      <BarChart3 className="h-3 w-3 mr-1.5" />
                      Analiz
                    </Button>
                    <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="border-white/12 bg-white/[0.035] text-xs hover:border-primary/45 hover:bg-primary/10">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/12 bg-white/[0.035] text-xs hover:border-primary/45 hover:bg-primary/10"
                      disabled={publishMutation.isPending}
                      onClick={() => publishMutation.mutate({ id: page.id, isPublished: !page.isPublished })}
                    >
                      {page.isPublished ? <PauseCircle className="h-3 w-3 mr-1.5" /> : <PlayCircle className="h-3 w-3 mr-1.5" />}
                      {page.isPublished ? "Durdur" : "Yayınla"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/12 bg-white/[0.035] text-xs text-destructive hover:border-destructive/45 hover:bg-destructive/10 hover:text-destructive"
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

      <PageAnalyticsDialog
        open={analyticsPageId !== null}
        onOpenChange={(open) => {
          if (!open) setAnalyticsPageId(null);
        }}
        pageId={analyticsPage?.id ?? null}
        pageTitle={analyticsPage?.title ?? "Bio sayfasi"}
        totalViews={analyticsPage?.views ?? 0}
        totalClicks={analyticsPage?.totalClicks ?? 0}
        todayViews={analyticsPage?.todayViews ?? 0}
        todayClicks={analyticsPage?.todayClicks ?? 0}
      />

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
                  llinktr.com/
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
