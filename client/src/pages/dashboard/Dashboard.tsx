import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
;
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
  Plus, Edit2, Trash2, Eye, ExternalLink,
  Globe, Loader2, LayoutDashboard, Link2, QrCode,
  MousePointerClick, PauseCircle, PlayCircle, Trophy, BarChart3, Search, TrendingUp, FileText, Settings, CalendarDays, ShieldAlert
} from "lucide-react";

export default function Dashboard() {
  const MAX_BIO_PAGES = 5;
  const pathname = usePathname();
  const router = useRouter();
  const navigate = (path) => router.push(path);
  const { user, isAuthenticated, loading, logout } = useAuth();
  const utils = trpc.useUtils();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [analyticsPageId, setAnalyticsPageId] = useState<number | null>(null);
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [slugError, setSlugError] = useState("");
  const [deleteAccountFirstOpen, setDeleteAccountFirstOpen] = useState(false);
  const [deleteAccountFinalOpen, setDeleteAccountFinalOpen] = useState(false);
  const [deleteAccountText, setDeleteAccountText] = useState("");

  const { data: pages, isLoading } = trpc.bioPages.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    placeholderData: (previous: unknown) => previous,
  });
  const pageCount = pages?.length ?? 0;
  const totalViews = pages?.reduce((sum, page) => sum + (page.views ?? 0), 0) ?? 0;
  const totalClicks = pages?.reduce((sum, page) => sum + (page.totalClicks ?? 0), 0) ?? 0;
  const todayClicks = pages?.reduce((sum, page) => sum + (page.todayClicks ?? 0), 0) ?? 0;
  const todayViews = pages?.reduce((sum, page) => sum + (page.todayViews ?? 0), 0) ?? 0;
  const bestPage = pages?.slice().sort((a, b) => (b.totalClicks ?? 0) - (a.totalClicks ?? 0))[0];
  const bestViewPage = pages?.slice().sort((a, b) => (b.views ?? 0) - (a.views ?? 0))[0];
  const bestClickPage = bestPage;
  const activePages = pages?.filter((page) => page.isPublished).length ?? 0;
  const dailyChange = totalViews > 0 ? Math.round(((todayViews + todayClicks) / Math.max(totalViews + totalClicks, 1)) * 100) : 0;
  const reachedPageLimit = pageCount >= MAX_BIO_PAGES;
  const analyticsPage = pages?.find((page) => page.id === analyticsPageId) ?? null;
  const [pageSearch, setPageSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [sortBy, setSortBy] = useState<"created" | "views" | "clicks" | "title">("created");
  const [tablePage, setTablePage] = useState(1);
  const pageSize = 6;
  const metricCards = [
    { label: "Toplam goruntulenme", value: totalViews, icon: Eye, note: "Tum sayfalar", bars: [24, 32, 38, 46, 54, 62, 72] },
    { label: "Toplam tiklama", value: totalClicks, icon: MousePointerClick, note: "Tum link tiklamalari", bars: [20, 26, 34, 42, 51, 60, 76] },
    { label: "En iyi link", value: bestPage?.title || "Yok", icon: Trophy, note: bestPage ? `${bestPage.totalClicks ?? 0} tiklama` : "Ilk sayfani olustur", bars: [20, 28, 36, 48, 62, 78, 92] },
    { label: "Aktif bio sayfasi", value: activePages, icon: FileText, note: `${pageCount} toplam sayfadan`, bars: [14, 22, 34, 38, 46, 54, 64] },
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

  const { data: slugCheck } = trpc.bioPages.checkSlug.useQuery(
    { slug: newSlug },
    { enabled: newSlug.length >= 2 && /^[a-z0-9_-]+$/.test(newSlug) }
  );

  const createMutation = trpc.bioPages.create.useMutation({
    onSuccess: () => {
      setCreateOpen(false);
      setNewSlug("");
      setNewTitle("");
      toast.success("Bio sayfas1 olu_turuldu!");
      utils.bioPages.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Bir hata olu_tu");
    },
  });

  const deleteMutation = trpc.bioPages.delete.useMutation({
    onSuccess: () => {
      utils.bioPages.list.invalidate();
      setDeleteId(null);
      toast.success("Bio sayfas1 silindi");
    },
    onError: (err) => toast.error(err.message),
  });

  const publishMutation = trpc.bioPages.update.useMutation({
    onSuccess: (_, variables) => {
      utils.bioPages.list.invalidate();
      toast.success(variables.isPublished ? "Sayfa yay1na al1nd1" : "Sayfa yay1n1 durduruldu");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: async (updatedUser) => {
      setProfileOpen(false);
      toast.success("Kullan1c1 ad1 g�ncellendi");
      utils.auth.me.setData(undefined, updatedUser);
      await utils.auth.me.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Kullan1c1 ad1 g�ncellenemedi");
    },
  });

  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation({
    onSuccess: async () => {
      toast.success("Hesab1n1z silindi");
      try {
        await logout();
      } catch {
        // The delete endpoint already clears the app cookie.
      }
      window.location.href = "/";
    },
    onError: (err) => {
      toast.error(err.message || "Hesap silinemedi");
    },
  });

  const handleSlugChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setNewSlug(clean);
    if (clean.length > 0 && clean.length < 2) {
      setSlugError("Slug en az 2 karakter olmal1");
    } else if (clean.length > 50) {
      setSlugError("Slug en fazla 50 karakter olabilir");
    } else {
      setSlugError("");
    }
  };

  const handleCreate = () => {
    if (reachedPageLimit) {
      toast.error(`Bir hesapta en fazla ${MAX_BIO_PAGES} bio sayfas1 a�abilirsiniz`);
      return;
    }
    if (!newSlug || !newTitle) return;
    if (slugError) return;
    if (slugCheck && !slugCheck.available) {
      setSlugError("Bu slug zaten kullan1l1yor");
      return;
    }
    createMutation.mutate({ slug: newSlug, title: newTitle });
  };

  const handleProfileSave = () => {
    const trimmedName = displayName.trim();
    if (trimmedName.length < 2) {
      toast.error("Kullan1c1 ad1 en az 2 karakter olmal1");
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
            <h2 className="text-2xl font-bold mb-2">Giri_ Yap1n</h2>
            <p className="text-muted-foreground mb-6">Panele eri_mek i�in giri_ yapman1z gerekiyor.</p>
            <a href={getLoginUrl()}>
              <Button className="bg-primary text-primary-foreground">Giri_ Yap</Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 container py-5 md:py-6">
        {/* Header */}
        <div className="mb-5">
          <section className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-4 py-4 panel-strong sm:px-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Panel ozeti
                </div>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Hos geldin, {user?.name || "kullanici"}</h1>
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">Bugunun ozeti hazir. En hizli aksiyon: bio sayfani duzenle, yayina al ve performansi takip et.</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-primary/45 bg-primary/10 px-2.5 py-1 font-semibold text-primary">%100 ucretsiz</span>
                  <span className="rounded-full border border-border/60 bg-background/40 px-2.5 py-1">{pageCount}/{MAX_BIO_PAGES} sayfa</span>
                  <span className="rounded-full border border-border/60 bg-background/40 px-2.5 py-1">Kredi karti gerekmez</span>
                </div>
              </div>
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:w-[430px] lg:shrink-0">
                <Button
                  onClick={() => setCreateOpen(true)}
                  disabled={reachedPageLimit}
                  className="h-10 w-full bg-primary font-bold text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_oklch(0.93_0.23_110/0.25)]"
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
                  className="h-10 w-full border-white/20 bg-background/60 font-semibold hover:border-primary/60 hover:bg-primary/10 focus-visible:ring-primary/30"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Hesap Ayarlar1
                </Button>
              </div>
            </div>
          </section>
        </div>
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {metricCards.map((card, cardIndex) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="panel-strong min-h-[150px] rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(18,24,32,0.96),rgba(12,14,16,0.94))] p-4 transition-all hover:-translate-y-0.5 hover:border-primary/25">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="min-w-0 text-sm text-muted-foreground">{card.label}</p>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </span>
                </div>
                <p className="truncate text-2xl font-black tracking-tight sm:text-3xl">{card.value}</p>
                <p className="mt-2 truncate text-xs text-muted-foreground">{card.note}</p>
                <div className="mt-4 flex h-8 items-end gap-1.5">
                  {card.bars.map((value, index) => (
                    <span key={`${card.label}-${index}`} className="mini-chart-bar flex-1 rounded-t bg-primary/80" style={{ height: `${value}%`, animationDelay: `${(index + cardIndex) * 45}ms` }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Tools */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Link href="/shortener">
            <div className="panel-strong group flex cursor-pointer items-center gap-4 rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-primary/40">
              <div className="h-10 w-10 rounded-lg bg-blue-400/10 flex items-center justify-center">
                <Link2 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Link K1salt1c1</p>
                <p className="text-xs text-muted-foreground">Uzun URL'leri k1salt</p>
                <p className="text-[11px] text-primary font-medium mt-1">%100 �cretsiz</p>
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
                <p className="font-semibold text-sm">QR Olu_turucu</p>
                <p className="text-xs text-muted-foreground">QR kod olu_tur ve indir</p>
                <p className="text-[11px] text-primary font-medium mt-1">%100 �cretsiz</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        </div>

        <section className="mb-6 rounded-2xl border border-white/10 bg-card/95 p-4 panel-strong">
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
          <h2 className="text-lg font-semibold mb-4">Bio Sayfalar1m</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !pages || pages.length === 0 ? (
            <div className="panel-strong rounded-2xl border border-dashed border-border/70 py-16 text-center">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Hen�z bio sayfan1z yok</h3>
              <p className="text-muted-foreground text-sm mb-6">0lk bio sayfan1z1 olu_turun ve linklerinizi payla_maya ba_lay1n.</p>
              <Button onClick={() => setCreateOpen(true)} className="bg-primary text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                0lk Sayfam1 Olu_tur
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
                      <span className="text-xs text-muted-foreground">{page.isPublished ? "Yay1nda" : "Taslak"}</span>
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
                        G�r�nt�lenme
                      </div>
                      <p className="text-lg font-bold">{page.views ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <MousePointerClick className="h-3.5 w-3.5" />
                        T1klama
                      </div>
                      <p className="text-lg font-bold">{page.totalClicks ?? 0}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/builder/${page.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full border-white/12 bg-white/[0.035] text-xs hover:border-primary/45 hover:bg-primary/10">
                        <Edit2 className="h-3 w-3 mr-1.5" />
                        D�zenle
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
                      {page.isPublished ? "Durdur" : "Yay1nla"}
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

      {/* Account Settings */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto border-border/60 bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Settings className="h-5 w-5 text-primary" />
              Hesap Ayarlar1
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <section className="rounded-2xl border border-white/10 bg-background/45 p-4">
              <div className="space-y-2">
              <Label htmlFor="displayName" className="text-xs uppercase tracking-wider text-muted-foreground">
                Kullan1c1 ad1
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="G�r�necek kullan1c1 ad1"
                className="border-white/20 bg-[#151515] focus-visible:border-primary focus-visible:ring-primary/25"
              />
              <p className="text-xs text-muted-foreground">Panelde ve kar_1lama alan1nda bu isim g�sterilir.</p>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-background/45 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Hesap s�resi
                </div>
                <p className="text-lg font-bold">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString("tr-TR") : "Bilgi yok"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/45 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <Eye className="h-4 w-4 text-primary" />
                  Toplam g�r�nt�lenme
                </div>
                <p className="text-lg font-bold">{totalViews}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/45 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <MousePointerClick className="h-4 w-4 text-primary" />
                  Toplam t1klama
                </div>
                <p className="text-lg font-bold">{totalClicks}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/45 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <FileText className="h-4 w-4 text-primary" />
                  Link sayfas1
                </div>
                <p className="text-lg font-bold">{pageCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/45 p-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">En y�ksek g�r�nt�lenme</p>
                <p className="truncate text-lg font-bold">{bestViewPage?.title || "Hen�z yok"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{bestViewPage ? `${bestViewPage.views ?? 0} g�r�nt�lenme` : "Sayfa yay1na al1nca g�r�n�r"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/45 p-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">En y�ksek t1klama</p>
                <p className="truncate text-lg font-bold">{bestClickPage?.title || "Hen�z yok"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{bestClickPage ? `${bestClickPage.totalClicks ?? 0} t1klama` : "Link t1klamas1 geldik�e g�r�n�r"}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-destructive">
                    <ShieldAlert className="h-4 w-4" />
                    Hesab1 Sil
                  </div>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                    Hesap, bio sayfalar1, bloklar, k1sa linkler ve ili_kili panel verileri kal1c1 olarak silinir.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteAccountFirstOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hesab1 Sil
                </Button>
              </div>
            </section>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileOpen(false)} className="border-border/60">
              Kapat
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

      <AlertDialog open={deleteAccountFirstOpen} onOpenChange={setDeleteAccountFirstOpen}>
        <AlertDialogContent className="border-border/60 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Hesab1n1z1 silmek istediinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu i_lem geri al1namaz. Devam ederseniz ikinci onay ad1m1na ge�eceksiniz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/60">Hay1r, geri d�n</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setDeleteAccountFirstOpen(false);
                setDeleteAccountText("");
                setDeleteAccountFinalOpen(true);
              }}
            >
              Evet, istiyorum
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAccountFinalOpen} onOpenChange={setDeleteAccountFinalOpen}>
        <AlertDialogContent className="border-border/60 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Son onay</AlertDialogTitle>
            <AlertDialogDescription>
              Hesab1 silmeyi onayl1yorsan1z kutuya ONAYLIYORUM yaz1n.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              value={deleteAccountText}
              onChange={(event) => setDeleteAccountText(event.target.value)}
              placeholder="ONAYLIYORUM"
              className="border-white/20 bg-[#151515] focus-visible:border-destructive focus-visible:ring-destructive/25"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/60">Vazge�</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteAccountText.trim().toLocaleLowerCase("tr-TR") !== "onayl1yorum" || deleteAccountMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-45"
              onClick={() => deleteAccountMutation.mutate({ confirmation: deleteAccountText })}
            >
              {deleteAccountMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hesab1 kal1c1 sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border/50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Bio Sayfas1</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              Her hesapta en fazla {MAX_BIO_PAGES} bio sayfas1 a�abilirsiniz.
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
                  {slugCheck.available ? " Bu slug kullan1labilir" : " Bu slug zaten al1nm1_"}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs uppercase tracking-wider text-muted-foreground">
                Sayfa Ba_l11
              </Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="�rn: Portfolyom"
                className="bg-input border-border/50 focus:border-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="border-border/50">
              0ptal
            </Button>
            <Button
              onClick={handleCreate}
              disabled={reachedPageLimit || !newSlug || !newTitle || !!slugError || createMutation.isPending || (slugCheck !== undefined && !slugCheck.available)}
              className="bg-primary text-primary-foreground"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Olu_tur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Bio sayfas1n1 sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu i_lem geri al1namaz. Bio sayfas1 ve t�m i�erii kal1c1 olarak silinecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50">0ptal</AlertDialogCancel>
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
