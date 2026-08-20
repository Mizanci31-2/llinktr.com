import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { Activity, BarChart3, BookOpen, CalendarDays, Clock3, Eye, FileText, Globe2, HelpCircle, ImagePlus, Inbox, Link2, Lock, LogOut, MapPin, MousePointerClick, Pencil, Plus, Radio, RefreshCw, RotateCcw, Save, Trash2, Users } from "lucide-react";
import {
  HOME_ADMIN_SETTINGS_KEY,
  defaultHomeAdminSettings,
  fetchHomeAdminSettings,
  readHomeAdminSettings,
  saveHomeAdminSettings,
  type HomeAdminSettings,
} from "@/lib/homeSettings";
import { getAllBlogPosts, readAdminBlogPosts, slugifyBlogTitle, writeAdminBlogPosts, type ManagedBlogPost } from "@/lib/blogAdminStore";
import {
  createHelpArticleId,
  fetchHelpArticles,
  helpCategoryOptions,
  readAdminHelpArticles,
  saveHelpArticles,
  writeAdminHelpArticles,
  type HelpCenterCategory,
  type ManagedHelpArticle,
} from "@/lib/helpCenterAdminStore";

type ContactMessage = {
  id: number;
  name: string;
  email: string;
  subject?: string;
  message: string;
  createdAt: string;
};

type AdminAnalytics = {
  liveVisitors: number;
  todayVisitors: number;
  todayViews: number;
  todayClicks: number;
  totalUsers: number;
  totalPages: number;
  totalLinks: number;
  usersWithPages: number;
  topViewedPage?: string | null;
  topClickedLink?: string | null;
  recentUsers: Array<{ id: string | number; name?: string | null; email?: string | null; createdAt?: string | Date | null }>;
  recentPages: Array<{ id: string | number; title?: string | null; slug?: string | null; createdAt?: string | Date | null }>;
  locations: Array<{ city?: string | null; country?: string | null; latitude?: number | null; longitude?: number | null }>;
  locationDistribution?: Array<{ label: string; city?: string | null; country?: string | null; count: number; latitude?: number | null; longitude?: number | null }>;
  timeDistribution?: Array<{ label: string; visitors: number; views: number; clicks: number }>;
  dateRange?: { startDate: string; endDate: string };
  totals?: { views: number; clicks: number };
};

type AnalyticsPreset = "today" | "7d" | "30d" | "month" | "custom";

function emptyBlogForm(): ManagedBlogPost {
  const now = new Date().toISOString();
  return {
    slug: "",
    title: "",
    description: "",
    intro: "",
    sections: [["", ""]],
    createdAt: now,
    updatedAt: now,
    source: "admin",
  };
}

function emptyHelpForm(): ManagedHelpArticle {
  const now = new Date().toISOString();
  return {
    id: "",
    title: "",
    category: "Ba_lang1�",
    summary: "",
    steps: [""],
    tags: [],
    createdAt: now,
    updatedAt: now,
    source: "admin",
  };
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPresetRange(preset: AnalyticsPreset) {
  const now = new Date();
  const start = new Date(now);
  if (preset === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (preset === "30d") {
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  } else if (preset === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  }
  return { startDate: toDateInput(start), endDate: toDateInput(now) };
}

function hasGeoPoint(location: { latitude?: number | null; longitude?: number | null }) {
  return typeof location.latitude === "number" && typeof location.longitude === "number";
}

function projectTurkeyPoint(lat: number, lng: number) {
  const minLng = 25.5;
  const maxLng = 45.0;
  const minLat = 35.5;
  const maxLat = 42.5;
  const x = ((lng - minLng) / (maxLng - minLng)) * 100;
  const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100;
  return {
    left: `${Math.min(92, Math.max(8, x))}%`,
    top: `${Math.min(86, Math.max(12, y))}%`,
  };
}

function AdminTurkeyMap({ analytics }: { analytics: AdminAnalytics | null }) {
  const distribution = analytics?.locationDistribution ?? [];
  const points = distribution.filter(hasGeoPoint);

  return (
    <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(145deg,#081016,#050505)] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.22)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">T�rkiye haritas1</h3>
            <p className="text-xs text-muted-foreground">Se�ili tarih aral11na g�re konum da1l1m1.</p>
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] text-muted-foreground">
          {distribution.length} nokta
        </span>
      </div>

      <div className="relative h-[280px] overflow-hidden rounded-2xl border border-white/10 bg-[#061113] sm:h-[320px]">
        <iframe
          title="T�rkiye ziyaret�i haritas1"
          src="https://www.openstreetmap.org/export/embed.html?bbox=25.5%2C35.5%2C45%2C42.5&layer=mapnik"
          className="absolute inset-0 h-full w-full border-0 opacity-75 grayscale invert"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/20" />

        {distribution.length === 0 ? (
          <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted-foreground">Konum verisi yok</div>
        ) : points.length === 0 ? (
          <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted-foreground">
            ^ehir verisi var, koordinat yok. Liste a_a1da g�steriliyor.
          </div>
        ) : (
          points.map((point, index) => {
            const position = projectTurkeyPoint(point.latitude!, point.longitude!);
            return (
              <span
                key={`${point.label}-${index}`}
                className="absolute grid h-4 w-4 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-[9px] font-black text-black shadow-[0_0_20px_rgba(214,255,0,0.55)]"
                style={position}
                title={`${point.label} - ${point.count}`}
              >
                {point.count}
              </span>
            );
          })
        )}
      </div>

      <div className="mt-3 grid gap-2">
        {distribution.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 bg-background/35 p-3 text-sm text-muted-foreground">Konum verisi yok</p>
        ) : (
          distribution.slice(0, 6).map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/24 px-3 py-2 text-sm">
              <span className="truncate">{item.label}</span>
              <b className="rounded-full bg-primary px-2 py-0.5 text-xs text-black">{item.count}</b>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


function formatAdminDate(value?: string | Date | null) {
  if (!value) return "Zaman verisi yok";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Zaman verisi yok";
  return date.toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function buildAdminActivity(analytics: AdminAnalytics | null) {
  const lastUser = analytics?.recentUsers?.[0];
  const lastPage = analytics?.recentPages?.[0];
  const userTime = lastUser?.createdAt ? new Date(lastUser.createdAt).getTime() : 0;
  const pageTime = lastPage?.createdAt ? new Date(lastPage.createdAt).getTime() : 0;
  const latestTime = userTime > pageTime ? lastUser?.createdAt : lastPage?.createdAt;

  return {
    hasActivity: Boolean((analytics?.liveVisitors ?? 0) > 0 || analytics?.topViewedPage || analytics?.topClickedLink || lastUser || lastPage),
    liveVisitors: analytics?.liveVisitors ?? 0,
    lastViewedPage: analytics?.topViewedPage || lastPage?.title || lastPage?.slug || "Veri yok",
    lastClickedLink: analytics?.topClickedLink || "Veri yok",
    lastUser: lastUser?.name || lastUser?.email || "Veri yok",
    lastBioPage: lastPage?.title || lastPage?.slug || "Veri yok",
    time: formatAdminDate(latestTime),
  };
}

function AdminLiveActivityCard({ analytics }: { analytics: AdminAnalytics | null }) {
  const activity = buildAdminActivity(analytics);
  const items = [
    { label: "Anlik ziyaretci", value: String(activity.liveVisitors), icon: Radio },
    { label: "Son goruntulenen sayfa", value: activity.lastViewedPage, icon: Eye },
    { label: "Son tiklanan link", value: activity.lastClickedLink, icon: MousePointerClick },
    { label: "Son kayit olan kullanici", value: activity.lastUser, icon: Users },
    { label: "Son olusturulan bio", value: activity.lastBioPage, icon: Link2 },
    { label: "Zaman", value: activity.time, icon: Clock3 },
  ];

  return (
    <div className="rounded-[18px] border border-primary/20 bg-[linear-gradient(145deg,rgba(214,255,0,0.08),rgba(255,255,255,0.035))] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.24)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold">
            <Activity className="h-4 w-4 text-primary" />
            Canli Aktivite
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">Realtime yoksa son kayitlardan guvenli ozet gosterilir.</p>
        </div>
        <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_18px_rgba(214,255,0,0.65)]" />
      </div>

      {!activity.hasActivity ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-background/35 p-5 text-sm text-muted-foreground">Henuz canli aktivite yok</div>
      ) : (
        <div className="grid gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-white/10 bg-black/22 px-3 py-2.5">
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
      )}
    </div>
  );
}

function AdminLiveLocationsCard({ analytics }: { analytics: AdminAnalytics | null }) {
  const distribution = analytics?.locationDistribution ?? [];
  const liveVisitors = analytics?.liveVisitors ?? 0;

  return (
    <div className="rounded-[18px] border border-primary/25 bg-[linear-gradient(145deg,rgba(214,255,0,0.075),rgba(5,5,5,0.82))] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold">
            <Radio className="h-4 w-4 text-primary" />
            Canl1 ki_i ve konumlar
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">Son sinyallerden canl1 ziyaret�i ve _ehir da1l1m1.</p>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-primary px-3 py-2 text-center text-black">
          <p className="text-[10px] font-bold uppercase">Canl1</p>
          <p className="text-2xl font-black leading-none">{liveVisitors}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {distribution.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-black/25 p-4 text-sm text-muted-foreground">
            Canl1 konum verisi yok. Konum verisi geldik�e _ehirler burada listelenir.
          </div>
        ) : (
          distribution.slice(0, 5).map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.city || item.country || "Konum"}</p>
              </div>
              <b className="rounded-full bg-primary px-2.5 py-1 text-xs text-black">{item.count} ki_i</b>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

async function uploadAdminImageToSupabase(file: File) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || import.meta.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "uploads";

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase Storage ayarlar1 eksik. VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY gerekli.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
  const storagePath = `admin/home/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const baseUrl = String(supabaseUrl).replace(/\/+$/, "");
  const uploadUrl = `${baseUrl}/storage/v1/object/${bucket}/${storagePath}`;
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "false",
    },
    body: file,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.message || "Fotoraf Supabase Storage'a y�klenemedi");
  }

  return `${baseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState(() => window.sessionStorage.getItem("llinktr.admin.password") || "");
  const [unlocked, setUnlocked] = useState(() => window.sessionStorage.getItem("llinktr.admin.unlocked") === "1");
  const [activeTab, setActiveTab] = useState<"home" | "analytics" | "blog" | "help" | "messages">("home");
  const [settings, setSettings] = useState<HomeAdminSettings>(() => readHomeAdminSettings());
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [adminBlogPosts, setAdminBlogPosts] = useState<ManagedBlogPost[]>(() => readAdminBlogPosts());
  const [blogForm, setBlogForm] = useState<ManagedBlogPost>(() => emptyBlogForm());
  const [editingBlogSlug, setEditingBlogSlug] = useState<string | null>(null);
  const [helpArticles, setHelpArticles] = useState<ManagedHelpArticle[]>(() => readAdminHelpArticles());
  const [helpForm, setHelpForm] = useState<ManagedHelpArticle>(() => emptyHelpForm());
  const [editingHelpId, setEditingHelpId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [analyticsPreset, setAnalyticsPreset] = useState<AnalyticsPreset>("7d");
  const [analyticsRange, setAnalyticsRange] = useState(() => getPresetRange("7d"));

  const rangeLabel = useMemo(() => {
    const start = new Date(`${analyticsRange.startDate}T00:00:00`);
    const end = new Date(`${analyticsRange.endDate}T00:00:00`);
    return `${start.toLocaleDateString("tr-TR")} - ${end.toLocaleDateString("tr-TR")}`;
  }, [analyticsRange.endDate, analyticsRange.startDate]);
  const allBlogPosts = useMemo(() => getAllBlogPosts(), [adminBlogPosts]);

  useEffect(() => {
    if (!unlocked) return;
    window.sessionStorage.setItem("llinktr.admin.unlocked", "1");
    window.sessionStorage.setItem("llinktr.admin.password", adminPassword);
  }, [adminPassword, unlocked]);

  const adminHeaders = () => ({ "x-admin-password": adminPassword });

  const loadMessages = async () => {
    setMessagesLoading(true);
    try {
      const response = await fetch("/api/contact-messages", {
        headers: adminHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Mesajlar al1namad1");
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Mesajlar al1namad1");
    } finally {
      setMessagesLoading(false);
    }
  };

  const loadAnalytics = async (range = analyticsRange) => {
    setAnalyticsLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: range.startDate,
        endDate: range.endDate,
      });
      const response = await fetch(`/api/admin-analytics?${params.toString()}`, { headers: adminHeaders() });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Analiz verileri alinamadi");
      setAnalytics(data.analytics ?? null);
    } catch (error) {
      setAnalytics(null);
      toast.error(error instanceof Error ? error.message : "Analiz verileri alinamadi");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (!unlocked) return;

    void loadMessages();
    void loadAnalytics();
    void fetchHelpArticles()
      .then((articles) => setHelpArticles(articles))
      .catch(() => setHelpArticles(readAdminHelpArticles()));
    void fetchHomeAdminSettings()
      .then((nextSettings) => {
        setSettings(nextSettings);
        window.localStorage.setItem(HOME_ADMIN_SETTINGS_KEY, JSON.stringify(nextSettings));
        window.dispatchEvent(new Event("llinktr-home-settings"));
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Ana sayfa ayarlar1 al1namad1"));
  }, [unlocked]);

  useEffect(() => {
    if (!unlocked || activeTab !== "analytics") return;
    void loadAnalytics(analyticsRange);
  }, [analyticsRange.endDate, analyticsRange.startDate, activeTab, unlocked]);

  useEffect(() => {
    if (!unlocked || activeTab !== "analytics") return;
    const interval = window.setInterval(() => {
      void loadAnalytics(analyticsRange);
    }, 30000);
    return () => window.clearInterval(interval);
  }, [analyticsRange.endDate, analyticsRange.startDate, activeTab, unlocked]);

  const applyAnalyticsPreset = (preset: AnalyticsPreset) => {
    setAnalyticsPreset(preset);
    if (preset !== "custom") setAnalyticsRange(getPresetRange(preset));
  };

  const update = (patch: Partial<HomeAdminSettings>) => setSettings((current) => ({ ...current, ...patch }));

  const save = async () => {
    setSettingsSaving(true);
    try {
      const nextSettings = await saveHomeAdminSettings(settings, adminPassword);
      setSettings(nextSettings);
      window.localStorage.setItem(HOME_ADMIN_SETTINGS_KEY, JSON.stringify(nextSettings));
      window.dispatchEvent(new Event("llinktr-home-settings"));
      toast.success("Ana sayfa ayarlar1 kaydedildi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ana sayfa ayarlar1 kaydedilemedi");
    } finally {
      setSettingsSaving(false);
    }
  };

  const reset = async () => {
    setSettingsSaving(true);
    try {
      const nextSettings = await saveHomeAdminSettings(defaultHomeAdminSettings, adminPassword);
      setSettings(nextSettings);
      window.localStorage.setItem(HOME_ADMIN_SETTINGS_KEY, JSON.stringify(nextSettings));
      window.dispatchEvent(new Event("llinktr-home-settings"));
      toast.success("Ana sayfa varsay1lana d�nd�");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ayarlar s1f1rlanamad1");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("L�tfen g�rsel dosyas1 se�in");
      return;
    }
    if (file.size > 7_000_000) {
      toast.error("G�rsel en fazla 7 MB olmal1");
      return;
    }

    setImageUploading(true);
    try {
      const url = await uploadAdminImageToSupabase(file);
      update({ heroImage: url });
      toast.success("Fotoraf y�klendi, kaydetmeyi unutma");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fotoraf y�klenemedi");
    } finally {
      setImageUploading(false);
    }
  };

  const deleteMessage = async (id: number) => {
    try {
      const response = await fetch(`/api/contact-messages/${id}`, {
        method: "DELETE",
        headers: adminHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Mesaj silinemedi");
      setMessages((current) => current.filter((message) => message.id !== id));
      toast.success("Mesaj silindi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Mesaj silinemedi");
    }
  };

  const updateBlogForm = (patch: Partial<ManagedBlogPost>) => {
    setBlogForm((current) => ({ ...current, ...patch }));
  };

  const updateBlogSection = (index: number, field: 0 | 1, value: string) => {
    setBlogForm((current) => {
      const sections = [...current.sections];
      const nextSection = sections[index] ?? ["", ""];
      nextSection[field] = value;
      sections[index] = nextSection;
      return { ...current, sections };
    });
  };

  const addBlogSection = () => {
    setBlogForm((current) => ({ ...current, sections: [...current.sections, ["", ""]] }));
  };

  const removeBlogSection = (index: number) => {
    setBlogForm((current) => ({
      ...current,
      sections: current.sections.length <= 1 ? current.sections : current.sections.filter((_, sectionIndex) => sectionIndex !== index),
    }));
  };

  const resetBlogForm = () => {
    setBlogForm(emptyBlogForm());
    setEditingBlogSlug(null);
  };

  const editBlogPost = (post: ManagedBlogPost) => {
    if (post.source !== "admin") {
      toast.info("Varsay1lan bloglar korunur. Yeni yaz1 olarak kopyalayabilirsin.");
      setBlogForm({
        ...post,
        slug: `${post.slug}-guncel`,
        title: `${post.title} - G�ncel`,
        source: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setEditingBlogSlug(null);
      setActiveTab("blog");
      return;
    }
    setBlogForm({ ...post, sections: post.sections.length ? post.sections : [["", ""]] });
    setEditingBlogSlug(post.slug);
  };

  const saveBlogPost = () => {
    const now = new Date().toISOString();
    const slug = (blogForm.slug || slugifyBlogTitle(blogForm.title)).trim();
    const sections = blogForm.sections
      .map((section) => [section[0].trim(), section[1].trim()] as [string, string])
      .filter((section) => section[0] && section[1]);

    if (!blogForm.title.trim() || !slug || !blogForm.description.trim() || !blogForm.intro.trim()) {
      toast.error("Ba_l1k, slug, a�1klama ve giri_ metni zorunlu.");
      return;
    }
    if (sections.length === 0) {
      toast.error("En az bir blog b�l�m� ekle.");
      return;
    }

    const defaultSlugConflict = getAllBlogPosts().some((post) => post.source === "default" && post.slug === slug);
    if (defaultSlugConflict && editingBlogSlug !== slug) {
      toast.error("Bu slug varsay1lan bloglarda kullan1l1yor. Farkl1 bir slug se�.");
      return;
    }

    const nextPost: ManagedBlogPost = {
      ...blogForm,
      slug,
      title: blogForm.title.trim(),
      description: blogForm.description.trim(),
      intro: blogForm.intro.trim(),
      sections,
      source: "admin",
      createdAt: blogForm.createdAt || now,
      updatedAt: now,
    };

    const nextPosts = [
      ...adminBlogPosts.filter((post) => post.slug !== (editingBlogSlug || slug)),
      nextPost,
    ].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

    setAdminBlogPosts(nextPosts);
    writeAdminBlogPosts(nextPosts);
    resetBlogForm();
    toast.success("Blog yaz1s1 kaydedildi");
  };

  const deleteBlogPost = (slug: string) => {
    const nextPosts = adminBlogPosts.filter((post) => post.slug !== slug);
    setAdminBlogPosts(nextPosts);
    writeAdminBlogPosts(nextPosts);
    if (editingBlogSlug === slug) resetBlogForm();
    toast.success("Blog yaz1s1 kald1r1ld1");
  };

  const updateHelpForm = (patch: Partial<ManagedHelpArticle>) => {
    setHelpForm((current) => ({ ...current, ...patch }));
  };

  const updateHelpStep = (index: number, value: string) => {
    setHelpForm((current) => {
      const steps = [...current.steps];
      steps[index] = value;
      return { ...current, steps };
    });
  };

  const addHelpStep = () => {
    setHelpForm((current) => ({ ...current, steps: [...current.steps, ""] }));
  };

  const removeHelpStep = (index: number) => {
    setHelpForm((current) => ({ ...current, steps: current.steps.length <= 1 ? current.steps : current.steps.filter((_, stepIndex) => stepIndex !== index) }));
  };

  const resetHelpForm = () => {
    setHelpForm(emptyHelpForm());
    setEditingHelpId(null);
  };

  const saveHelpArticle = async () => {
    const now = new Date().toISOString();
    const steps = helpForm.steps.map((step) => step.trim()).filter(Boolean);
    const tags = String(helpForm.tags.join(","))
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!helpForm.title.trim() || !helpForm.summary.trim() || steps.length === 0) {
      toast.error("Ba_l1k, k1sa a�1klama ve en az bir ad1m zorunlu.");
      return;
    }

    const nextArticle: ManagedHelpArticle = {
      ...helpForm,
      id: editingHelpId || helpForm.id || createHelpArticleId(helpForm.title),
      title: helpForm.title.trim(),
      summary: helpForm.summary.trim(),
      category: helpForm.category,
      steps,
      tags,
      createdAt: helpForm.createdAt || now,
      updatedAt: now,
      source: "admin",
    };

    const nextArticles = [
      ...helpArticles.filter((article) => article.id !== (editingHelpId || nextArticle.id)),
      nextArticle,
    ].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

    try {
      const savedArticles = await saveHelpArticles(nextArticles, adminPassword);
      setHelpArticles(savedArticles);
      resetHelpForm();
      toast.success("Yard1m merkezi g�nderisi kaydedildi");
    } catch (error) {
      writeAdminHelpArticles(nextArticles);
      setHelpArticles(nextArticles);
      toast.error(error instanceof Error ? error.message : "Yard1m merkezi g�nderisi kaydedilemedi");
    }
  };

  const editHelpArticle = (article: ManagedHelpArticle) => {
    setHelpForm({ ...article, steps: article.steps.length ? article.steps : [""], tags: article.tags ?? [] });
    setEditingHelpId(article.id);
    setActiveTab("help");
  };

  const deleteHelpArticle = async (id: string) => {
    const nextArticles = helpArticles.filter((article) => article.id !== id);
    try {
      const savedArticles = await saveHelpArticles(nextArticles, adminPassword);
      setHelpArticles(savedArticles);
      if (editingHelpId === id) resetHelpForm();
      toast.success("Yard1m merkezi g�nderisi silindi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Yard1m merkezi g�nderisi silinemedi");
    }
  };

  if (!unlocked) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="container flex flex-1 items-center justify-center py-16">
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                const response = await fetch("/api/admin-login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ password }),
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok || !data?.success) throw new Error(data?.message || "Admin sifresi hatali");
                setAdminPassword(password);
                setUnlocked(true);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Admin sifresi hatali");
              }
            }}
            className="w-full max-w-md rounded-[18px] border border-white/10 bg-card p-6 shadow-2xl"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-black">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">Admin Paneli</h1>
            <p className="mt-2 text-sm text-muted-foreground">Ana sayfa g�rseli ve metinlerini d�zenlemek i�in _ifreyi gir.</p>
            <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Admin _ifresi" className="mt-6" />
            <Button className="mt-4 w-full bg-primary font-bold text-primary-foreground">Giri_ Yap</Button>
          </form>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container flex-1 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Paneli</h1>
            <p className="mt-1 text-sm text-muted-foreground">Ana sayfa sa g�rseli ve hero metinleri.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                window.sessionStorage.removeItem("llinktr.admin.unlocked");
                window.sessionStorage.removeItem("llinktr.admin.password");
                setUnlocked(false);
                setAdminPassword("");
                setPassword("");
              }}
            >
              <LogOut className="h-4 w-4" />
              Cikis
            </Button>
            <Button variant="outline" onClick={() => void reset()} disabled={settingsSaving || imageUploading}>
              <RotateCcw className="h-4 w-4" />
              S1f1rla
            </Button>
            <Button onClick={() => void save()} disabled={settingsSaving || imageUploading} className="bg-primary font-bold text-primary-foreground">
              <Save className="h-4 w-4" />
              {settingsSaving ? "Kaydediliyor" : "Kaydet"}
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-2 rounded-2xl border border-white/10 bg-card/70 p-2 sm:grid-cols-5">
          {[
            { id: "home", label: "Ana Sayfa" },
            { id: "analytics", label: "Analiz Merkezi" },
            { id: "blog", label: "Blog" },
            { id: "help", label: "Yard1m Merkezi" },
            { id: "messages", label: "Formlar" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${activeTab === tab.id ? "bg-primary text-black" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "home" && <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(340px,0.8fr)]">
          <section className="rounded-[18px] border border-white/10 bg-card p-5">
            <h2 className="text-lg font-semibold">Ana Sayfa D�zenle</h2>
            <div className="mt-5 space-y-5">
              <div className="space-y-2">
                <Label>Ba_l1k</Label>
                <Input value={settings.heroTitle} onChange={(event) => update({ heroTitle: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Alt ba_l1k</Label>
                <Textarea value={settings.heroSubtitle} onChange={(event) => update({ heroSubtitle: event.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Sosyal kan1t yaz1s1</Label>
                <Input value={settings.heroProof} onChange={(event) => update({ heroProof: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Sa taraf fotoraf1</Label>
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-background/55 p-5 text-center transition-colors hover:border-primary/45">
                  <ImagePlus className="mb-2 h-6 w-6 text-primary" />
                  <span className="text-sm font-semibold">{imageUploading ? "Fotoraf y�kleniyor..." : "Fotoraf ekle veya dei_tir"}</span>
                  <span className="mt-1 text-xs text-muted-foreground">PNG, JPG veya WebP. Maksimum 7 MB.</span>
                  <input disabled={imageUploading} type="file" accept="image/*" className="sr-only" onChange={(event) => void handleImage(event.target.files?.[0])} />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-[18px] border border-white/10 bg-card p-5">
            <h2 className="text-lg font-semibold">Canl1 �nizleme</h2>
            <div className="mt-5 overflow-hidden rounded-[18px] border border-white/10 bg-black p-3">
              <img src={settings.heroImage} alt="Ana sayfa g�rsel �nizleme" className="aspect-[16/10] w-full rounded-[14px] object-cover" />
            </div>
            <h3 className="mt-5 text-2xl font-black">{settings.heroTitle}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{settings.heroSubtitle}</p>
            <p className="mt-3 text-xs text-primary">{settings.heroProof}</p>
          </section>
        </div>}

        {activeTab === "analytics" && (
          <section className="space-y-5 rounded-[18px] border border-white/10 bg-card p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Analiz Merkezi
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">Se�ili aral1k: {rangeLabel}. Veriler mevcut Supabase tablolar1ndan g�venli okunur.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {([
                  ["today", "Bug�n"],
                  ["7d", "Son 7 g�n"],
                  ["30d", "Son 30 g�n"],
                  ["month", "Bu ay"],
                ] as Array<[AnalyticsPreset, string]>).map(([preset, label]) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={analyticsPreset === preset ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyAnalyticsPreset(preset)}
                    className={analyticsPreset === preset ? "bg-primary font-bold text-black" : "border-border/60"}
                  >
                    {label}
                  </Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => void loadAnalytics()} disabled={analyticsLoading}>
                  <RefreshCw className={`h-4 w-4 ${analyticsLoading ? "animate-spin" : ""}`} />
                  Yenile
                </Button>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-border/60 bg-background/35 p-3 md:grid-cols-[1fr_1fr_auto]">
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
                Ba_lang1� tarihi
                <Input
                  type="date"
                  value={analyticsRange.startDate}
                  onChange={(event) => {
                    setAnalyticsPreset("custom");
                    setAnalyticsRange((current) => ({ ...current, startDate: event.target.value }));
                  }}
                  className="h-11 bg-input"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
                Biti_ tarihi
                <Input
                  type="date"
                  value={analyticsRange.endDate}
                  onChange={(event) => {
                    setAnalyticsPreset("custom");
                    setAnalyticsRange((current) => ({ ...current, endDate: event.target.value }));
                  }}
                  className="h-11 bg-input"
                />
              </label>
              <div className="flex items-end">
                <Button onClick={() => void loadAnalytics()} disabled={analyticsLoading} className="h-11 w-full bg-primary font-bold text-black md:w-auto">
                  <CalendarDays className="h-4 w-4" />
                  Filtrele
                </Button>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="rounded-2xl border border-border/50 bg-background/35 p-6 text-sm text-muted-foreground">Analiz verileri yukleniyor...</div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.85fr)]">
                <div className="space-y-4">
                  {analytics && (analytics.todayVisitors ?? 0) === 0 && (analytics.todayViews ?? 0) === 0 && (analytics.todayClicks ?? 0) === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-background/35 p-4 text-sm text-muted-foreground">
                      Bu tarih aral11nda veri yok.
                    </div>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {([
                      ["Canli kisi", analytics?.liveVisitors ?? 0, Users],
                      ["Ziyaret�i", analytics?.todayVisitors ?? 0, Users],
                      ["G�r�nt�lenme", analytics?.todayViews ?? 0, Eye],
                      ["T1klama", analytics?.todayClicks ?? 0, MousePointerClick],
                      ["Toplam hesap", analytics?.totalUsers ?? 0, Users],
                      ["Toplam link sayfasi", analytics?.totalPages ?? 0, Link2],
                      ["Toplam link", analytics?.totalLinks ?? 0, Link2],
                      ["Link sayfasi olan kisi", analytics?.usersWithPages ?? 0, Users],
                    ] as Array<[string, number, typeof Users]>).map(([label, value, Icon]) => (
                      <div key={String(label)} className="rounded-2xl border border-border/60 bg-background/45 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs text-muted-foreground">{String(label)}</p>
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <p className="mt-2 truncate text-2xl font-black">{String(value)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/45 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="font-semibold">Zaman da1l1m1</h3>
                      <Clock3 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="grid h-32 grid-cols-12 items-end gap-1 sm:[grid-template-columns:repeat(24,minmax(0,1fr))]">
                      {(analytics?.timeDistribution ?? []).slice(0, 24).map((item, index) => {
                        const maxValue = Math.max(...(analytics?.timeDistribution ?? []).map((entry) => Math.max(entry.views, entry.clicks, entry.visitors)), 1);
                        const value = Math.max(item.views, item.clicks, item.visitors);
                        return (
                          <div key={item.label} className="flex h-full min-w-0 flex-col justify-end gap-1" title={`${item.label}: ${value}`}>
                            <div
                              className="w-full rounded-t-md bg-primary/85 shadow-[0_0_12px_rgba(214,255,0,0.18)]"
                              style={{ height: `${Math.max(8, (value / maxValue) * 100)}%` }}
                            />
                            {index % 4 === 0 ? <span className="truncate text-center text-[9px] text-muted-foreground">{item.label.slice(0, 2)}</span> : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/45 p-4">
                    <h3 className="font-semibold">Ozet</h3>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>Guncel hesap: <b className="text-foreground">{analytics?.totalUsers ?? 0}</b></p>
                      <p>Link sayfasi olan kisi: <b className="text-foreground">{analytics?.usersWithPages ?? 0}</b></p>
                      <p>Toplam link sayfasi: <b className="text-foreground">{analytics?.totalPages ?? 0}</b></p>
                      <p>Toplam link: <b className="text-foreground">{analytics?.totalLinks ?? 0}</b></p>
                      <p>En cok goruntulenen sayfa: <b className="text-foreground">{analytics?.topViewedPage || "Veri yok"}</b></p>
                      <p>En cok tiklanan link: <b className="text-foreground">{analytics?.topClickedLink || "Veri yok"}</b></p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-border/60 bg-background/45 p-4">
                      <h3 className="font-semibold">Son kayit olan kullanicilar</h3>
                      <div className="mt-3 space-y-2">
                        {(analytics?.recentUsers ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Veri yok</p> : analytics!.recentUsers.map((item) => (
                          <p key={String(item.id)} className="truncate rounded-xl bg-white/[0.04] px-3 py-2 text-sm">{item.name || item.email || "Kullanici"}</p>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/45 p-4">
                      <h3 className="font-semibold">Son olusturulan link sayfalari</h3>
                      <div className="mt-3 space-y-2">
                        {(analytics?.recentPages ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Veri yok</p> : analytics!.recentPages.map((item) => (
                          <p key={String(item.id)} className="truncate rounded-xl bg-white/[0.04] px-3 py-2 text-sm">{item.title || item.slug || "Sayfa"}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="space-y-4">
                  <AdminLiveActivityCard analytics={analytics} />
                  <AdminLiveLocationsCard analytics={analytics} />
                  <AdminTurkeyMap analytics={analytics} />
                  <div className="rounded-[18px] border border-white/10 bg-background/45 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Globe2 className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">Lokasyon da1l1m1</h3>
                    </div>
                    {(analytics?.locationDistribution ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Konum verisi yok</p>
                    ) : (
                      <div className="space-y-2">
                        {analytics!.locationDistribution!.slice(0, 8).map((item) => (
                          <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-3 py-2 text-sm">
                            <span className="truncate">{item.label}</span>
                            <b className="text-primary">{item.count}</b>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            )}
          </section>
        )}

        {activeTab === "blog" && (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.75fr)]">
            <div className="rounded-[18px] border border-white/10 bg-card p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Blog g�nderisi ekle
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">SEO blog sayfas1na yeni rehber yaz1s1 ekle. Varsay1lan yaz1lar korunur.</p>
                </div>
                <Button variant="outline" onClick={resetBlogForm}>
                  <Plus className="h-4 w-4" />
                  Yeni yaz1
                </Button>
              </div>

              <div className="mt-5 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold">Ba_l1k</span>
                    <Input
                      value={blogForm.title}
                      onChange={(event) => {
                        const title = event.target.value;
                        updateBlogForm({ title, slug: editingBlogSlug ? blogForm.slug : slugifyBlogTitle(title) });
                      }}
                      placeholder="Instagram Bio Linki Nas1l Olu_turulur?"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold">SEO slug</span>
                    <Input
                      value={blogForm.slug}
                      onChange={(event) => updateBlogForm({ slug: slugifyBlogTitle(event.target.value) })}
                      placeholder="instagram-bio-linki"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold">K1sa a�1klama</span>
                  <Textarea
                    value={blogForm.description}
                    onChange={(event) => updateBlogForm({ description: event.target.value })}
                    rows={2}
                    placeholder="Google ve blog kartlar1nda g�r�necek k1sa a�1klama."
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold">Giri_ metni</span>
                  <Textarea
                    value={blogForm.intro}
                    onChange={(event) => updateBlogForm({ intro: event.target.value })}
                    rows={4}
                    placeholder="Yaz1n1n ilk �zet paragraf1."
                  />
                </label>

                <div className="rounded-2xl border border-border/60 bg-background/35 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">Yaz1 b�l�mleri</h3>
                      <p className="text-xs text-muted-foreground">Her b�l�m ba_l1k ve metinden olu_ur.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addBlogSection}>
                      <Plus className="h-4 w-4" />
                      B�l�m ekle
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {blogForm.sections.map((section, index) => (
                      <div key={index} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold">B�l�m {index + 1}</p>
                          <Button type="button" variant="outline" size="sm" className="border-destructive/40 text-destructive hover:text-destructive" onClick={() => removeBlogSection(index)}>
                            <Trash2 className="h-4 w-4" />
                            Sil
                          </Button>
                        </div>
                        <Input value={section[0]} onChange={(event) => updateBlogSection(index, 0, event.target.value)} placeholder="B�l�m ba_l11" />
                        <Textarea value={section[1]} onChange={(event) => updateBlogSection(index, 1, event.target.value)} rows={4} placeholder="B�l�m metni" className="mt-2" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={resetBlogForm}>Temizle</Button>
                  <Button onClick={saveBlogPost} className="bg-primary font-bold text-black">
                    <Save className="h-4 w-4" />
                    {editingBlogSlug ? "Blogu g�ncelle" : "Blogu yay1nla"}
                  </Button>
                </div>
              </div>
            </div>

            <aside className="rounded-[18px] border border-white/10 bg-card p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <FileText className="h-5 w-5 text-primary" />
                    G�ncel bloglar
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">{allBlogPosts.length} yaz1 blog sayfas1na bal1.</p>
                </div>
              </div>

              <div className="space-y-3">
                {allBlogPosts.map((post) => (
                  <article key={`${post.source}-${post.slug}`} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${post.source === "admin" ? "bg-primary text-black" : "bg-white/10 text-muted-foreground"}`}>
                            {post.source === "admin" ? "Admin" : "Varsay1lan"}
                          </span>
                          <span className="truncate text-[11px] text-muted-foreground">/blog/{post.slug}</span>
                        </div>
                        <h3 className="line-clamp-2 font-semibold">{post.title}</h3>
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{post.description}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => editBlogPost(post)}>
                        <Pencil className="h-4 w-4" />
                        {post.source === "admin" ? "D�zenle" : "Kopyala"}
                      </Button>
                      {post.source === "admin" ? (
                        <Button type="button" variant="outline" size="sm" className="border-destructive/40 text-destructive hover:text-destructive" onClick={() => deleteBlogPost(post.slug)}>
                          <Trash2 className="h-4 w-4" />
                          Sil
                        </Button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </aside>
          </section>
        )}

        {activeTab === "help" && (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.75fr)]">
            <div className="rounded-[18px] border border-white/10 bg-card p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    Yard1m merkezi g�nderisi ekle
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">Yard1m merkezindeki arama ve kategori i�eriklerine yeni rehber ekle.</p>
                </div>
                <Button variant="outline" onClick={resetHelpForm}>
                  <Plus className="h-4 w-4" />
                  Yeni g�nderi
                </Button>
              </div>

              <div className="mt-5 grid gap-4">
                <div className="grid gap-4 md:grid-cols-[1fr_240px]">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold">Ba_l1k</span>
                    <Input value={helpForm.title} onChange={(event) => updateHelpForm({ title: event.target.value })} placeholder="Link ikonunu nas1l dei_tiririm?" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold">Kategori</span>
                    <select
                      value={helpForm.category}
                      onChange={(event) => updateHelpForm({ category: event.target.value as HelpCenterCategory })}
                      className="h-11 rounded-xl border border-input bg-input px-3 text-sm font-semibold outline-none focus:border-primary"
                    >
                      {helpCategoryOptions.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold">K1sa a�1klama</span>
                  <Textarea
                    value={helpForm.summary}
                    onChange={(event) => updateHelpForm({ summary: event.target.value })}
                    rows={2}
                    placeholder="Aramada ve kategori detay1nda g�r�necek k1sa a�1klama."
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold">Etiketler</span>
                  <Input
                    value={helpForm.tags.join(", ")}
                    onChange={(event) => updateHelpForm({ tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })}
                    placeholder="link, ikon, d�zenleme"
                  />
                </label>

                <div className="rounded-2xl border border-border/60 bg-background/35 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">Ad1m ad1m rehber</h3>
                      <p className="text-xs text-muted-foreground">Kullan1c1 konuyu a�1nca bu ad1mlar listelenir.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addHelpStep}>
                      <Plus className="h-4 w-4" />
                      Ad1m ekle
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {helpForm.steps.map((step, index) => (
                      <div key={index} className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                        <Input value={step} onChange={(event) => updateHelpStep(index, event.target.value)} placeholder={`Ad1m ${index + 1}`} />
                        <Button type="button" variant="outline" size="sm" className="border-destructive/40 text-destructive hover:text-destructive" onClick={() => removeHelpStep(index)}>
                          <Trash2 className="h-4 w-4" />
                          Sil
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={resetHelpForm}>Temizle</Button>
                  <Button onClick={() => void saveHelpArticle()} className="bg-primary font-bold text-black">
                    <Save className="h-4 w-4" />
                    {editingHelpId ? "G�nderiyi g�ncelle" : "G�nderiyi yay1nla"}
                  </Button>
                </div>
              </div>
            </div>

            <aside className="rounded-[18px] border border-white/10 bg-card p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <FileText className="h-5 w-5 text-primary" />
                    G�ncel yard1m g�nderileri
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">{helpArticles.length} admin g�nderisi yard1m merkezine bal1.</p>
                </div>
              </div>

              {helpArticles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 bg-background/35 p-5 text-sm text-muted-foreground">
                  Hen�z admin yard1m g�nderisi yok. Varsay1lan rehberler yay1nda kal1r.
                </div>
              ) : (
                <div className="space-y-3">
                  {helpArticles.map((article) => (
                    <article key={article.id} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase text-black">{article.category}</span>
                        <span className="truncate text-[11px] text-muted-foreground">{article.steps.length} ad1m</span>
                      </div>
                      <h3 className="line-clamp-2 font-semibold">{article.title}</h3>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{article.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => editHelpArticle(article)}>
                          <Pencil className="h-4 w-4" />
                          D�zenle
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="border-destructive/40 text-destructive hover:text-destructive" onClick={() => void deleteHelpArticle(article.id)}>
                          <Trash2 className="h-4 w-4" />
                          Sil
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </aside>
          </section>
        )}

        {activeTab === "messages" && <section className="rounded-[18px] border border-white/10 bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Inbox className="h-5 w-5 text-primary" />
                0leti_im Formlar1
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">0leti_im sayfas1ndan g�nderilen mesajlar burada g�r�n�r.</p>
            </div>
            <Button variant="outline" onClick={() => void loadMessages()} disabled={messagesLoading}>
              <RefreshCw className={`h-4 w-4 ${messagesLoading ? "animate-spin" : ""}`} />
              Yenile
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {messagesLoading ? (
              <div className="rounded-2xl border border-border/50 bg-background/35 p-5 text-sm text-muted-foreground">Mesajlar y�kleniyor...</div>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl border border-border/50 bg-background/35 p-5 text-sm text-muted-foreground">Hen�z g�nderilmi_ ileti_im formu yok.</div>
            ) : (
              messages.map((item) => (
                <article key={item.id} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{item.subject || "Konu belirtilmedi"}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.name} "{" "}
                        <a href={`mailto:${item.email}`} className="text-primary hover:underline">
                          {item.email}
                        </a>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/80">{new Date(item.createdAt).toLocaleString("tr-TR")}</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-border/50 text-destructive hover:text-destructive" onClick={() => void deleteMessage(item.id)}>
                      <Trash2 className="h-4 w-4" />
                      Sil
                    </Button>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{item.message}</p>
                </article>
              ))
            )}
          </div>
        </section>}
      </main>
      <Footer />
    </div>
  );
}
