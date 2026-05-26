import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { BarChart3, Eye, ImagePlus, Inbox, Link2, Lock, LogOut, MapPin, MousePointerClick, RefreshCw, RotateCcw, Save, Trash2, Users } from "lucide-react";
import {
  HOME_ADMIN_SETTINGS_KEY,
  defaultHomeAdminSettings,
  fetchHomeAdminSettings,
  readHomeAdminSettings,
  saveHomeAdminSettings,
  type HomeAdminSettings,
} from "@/lib/homeSettings";

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
};

async function uploadAdminImageToSupabase(file: File) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || import.meta.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "uploads";

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase Storage ayarları eksik. VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY gerekli.");
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
    throw new Error(errorData?.message || "Fotoğraf Supabase Storage'a yüklenemedi");
  }

  return `${baseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState(() => window.sessionStorage.getItem("llinktr.admin.password") || "");
  const [unlocked, setUnlocked] = useState(() => window.sessionStorage.getItem("llinktr.admin.unlocked") === "1");
  const [activeTab, setActiveTab] = useState<"home" | "analytics" | "messages">("home");
  const [settings, setSettings] = useState<HomeAdminSettings>(() => readHomeAdminSettings());
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

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
      if (!response.ok) throw new Error(data?.message || "Mesajlar alınamadı");
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Mesajlar alınamadı");
    } finally {
      setMessagesLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch("/api/admin-analytics", { headers: adminHeaders() });
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
    void fetchHomeAdminSettings()
      .then((nextSettings) => {
        setSettings(nextSettings);
        window.localStorage.setItem(HOME_ADMIN_SETTINGS_KEY, JSON.stringify(nextSettings));
        window.dispatchEvent(new Event("llinktr-home-settings"));
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Ana sayfa ayarları alınamadı"));
  }, [unlocked]);

  const update = (patch: Partial<HomeAdminSettings>) => setSettings((current) => ({ ...current, ...patch }));

  const save = async () => {
    setSettingsSaving(true);
    try {
      const nextSettings = await saveHomeAdminSettings(settings, adminPassword);
      setSettings(nextSettings);
      window.localStorage.setItem(HOME_ADMIN_SETTINGS_KEY, JSON.stringify(nextSettings));
      window.dispatchEvent(new Event("llinktr-home-settings"));
      toast.success("Ana sayfa ayarları kaydedildi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ana sayfa ayarları kaydedilemedi");
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
      toast.success("Ana sayfa varsayılana döndü");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ayarlar sıfırlanamadı");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen görsel dosyası seçin");
      return;
    }
    if (file.size > 7_000_000) {
      toast.error("Görsel en fazla 7 MB olmalı");
      return;
    }

    setImageUploading(true);
    try {
      const url = await uploadAdminImageToSupabase(file);
      update({ heroImage: url });
      toast.success("Fotoğraf yüklendi, kaydetmeyi unutma");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fotoğraf yüklenemedi");
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
            <p className="mt-2 text-sm text-muted-foreground">Ana sayfa görseli ve metinlerini düzenlemek için şifreyi gir.</p>
            <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Admin şifresi" className="mt-6" />
            <Button className="mt-4 w-full bg-primary font-bold text-primary-foreground">Giriş Yap</Button>
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
            <p className="mt-1 text-sm text-muted-foreground">Ana sayfa sağ görseli ve hero metinleri.</p>
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
              Sıfırla
            </Button>
            <Button onClick={() => void save()} disabled={settingsSaving || imageUploading} className="bg-primary font-bold text-primary-foreground">
              <Save className="h-4 w-4" />
              {settingsSaving ? "Kaydediliyor" : "Kaydet"}
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-2 rounded-2xl border border-white/10 bg-card/70 p-2 sm:grid-cols-3">
          {[
            { id: "home", label: "Ana Sayfa" },
            { id: "analytics", label: "Analiz Merkezi" },
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
            <h2 className="text-lg font-semibold">Ana Sayfa Düzenle</h2>
            <div className="mt-5 space-y-5">
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input value={settings.heroTitle} onChange={(event) => update({ heroTitle: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Alt başlık</Label>
                <Textarea value={settings.heroSubtitle} onChange={(event) => update({ heroSubtitle: event.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Sosyal kanıt yazısı</Label>
                <Input value={settings.heroProof} onChange={(event) => update({ heroProof: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Sağ taraf fotoğrafı</Label>
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-background/55 p-5 text-center transition-colors hover:border-primary/45">
                  <ImagePlus className="mb-2 h-6 w-6 text-primary" />
                  <span className="text-sm font-semibold">{imageUploading ? "Fotoğraf yükleniyor..." : "Fotoğraf ekle veya değiştir"}</span>
                  <span className="mt-1 text-xs text-muted-foreground">PNG, JPG veya WebP. Maksimum 7 MB.</span>
                  <input disabled={imageUploading} type="file" accept="image/*" className="sr-only" onChange={(event) => void handleImage(event.target.files?.[0])} />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-[18px] border border-white/10 bg-card p-5">
            <h2 className="text-lg font-semibold">Canlı Önizleme</h2>
            <div className="mt-5 overflow-hidden rounded-[18px] border border-white/10 bg-black p-3">
              <img src={settings.heroImage} alt="Ana sayfa görsel önizleme" className="aspect-[16/10] w-full rounded-[14px] object-cover" />
            </div>
            <h3 className="mt-5 text-2xl font-black">{settings.heroTitle}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{settings.heroSubtitle}</p>
            <p className="mt-3 text-xs text-primary">{settings.heroProof}</p>
          </section>
        </div>}

        {activeTab === "analytics" && (
          <section className="rounded-[18px] border border-white/10 bg-card p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Analiz Merkezi
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">Supabase/veri kaynagi uygunsa canli metrikler, degilse guvenli bos durum.</p>
              </div>
              <Button variant="outline" onClick={() => void loadAnalytics()} disabled={analyticsLoading}>
                <RefreshCw className={`h-4 w-4 ${analyticsLoading ? "animate-spin" : ""}`} />
                Yenile
              </Button>
            </div>

            {analyticsLoading ? (
              <div className="rounded-2xl border border-border/50 bg-background/35 p-6 text-sm text-muted-foreground">Analiz verileri yukleniyor...</div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.85fr)]">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {([
                      ["Canli kisi", analytics?.liveVisitors ?? 0, Users],
                      ["Bugunku ziyaretci", analytics?.todayVisitors ?? 0, Users],
                      ["Bugunku goruntuleme", analytics?.todayViews ?? 0, Eye],
                      ["Bugunku tiklama", analytics?.todayClicks ?? 0, MousePointerClick],
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

                <div className="min-h-[360px] rounded-[18px] border border-white/10 bg-[radial-gradient(circle_at_50%_38%,rgba(214,255,0,0.15),transparent_30%),linear-gradient(145deg,#081016,#050505)] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Canli harita</h3>
                  </div>
                  <div className="relative h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-black/35">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:42px_42px]" />
                    {(analytics?.locations ?? []).length === 0 ? (
                      <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">Konum verisi yok</div>
                    ) : (
                      analytics!.locations.slice(0, 12).map((loc, index) => (
                        <span key={`${loc.city}-${index}`} className="absolute rounded-full bg-primary shadow-[0_0_20px_rgba(214,255,0,0.4)]" style={{ left: `${18 + (index * 17) % 68}%`, top: `${22 + (index * 23) % 56}%`, width: 10, height: 10 }} title={`${loc.city || ""} ${loc.country || ""}`} />
                      ))
                    )}
                    <span className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-xs text-muted-foreground">Turkiye merkezli gorunum</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "messages" && <section className="rounded-[18px] border border-white/10 bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Inbox className="h-5 w-5 text-primary" />
                İletişim Formları
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">İletişim sayfasından gönderilen mesajlar burada görünür.</p>
            </div>
            <Button variant="outline" onClick={() => void loadMessages()} disabled={messagesLoading}>
              <RefreshCw className={`h-4 w-4 ${messagesLoading ? "animate-spin" : ""}`} />
              Yenile
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {messagesLoading ? (
              <div className="rounded-2xl border border-border/50 bg-background/35 p-5 text-sm text-muted-foreground">Mesajlar yükleniyor...</div>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl border border-border/50 bg-background/35 p-5 text-sm text-muted-foreground">Henüz gönderilmiş iletişim formu yok.</div>
            ) : (
              messages.map((item) => (
                <article key={item.id} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{item.subject || "Konu belirtilmedi"}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.name} •{" "}
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
