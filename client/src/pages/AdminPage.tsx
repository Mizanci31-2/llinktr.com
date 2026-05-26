import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { ImagePlus, Inbox, Lock, RefreshCw, RotateCcw, Save, Trash2 } from "lucide-react";
import {
  HOME_ADMIN_SETTINGS_KEY,
  defaultHomeAdminSettings,
  fetchHomeAdminSettings,
  readHomeAdminSettings,
  saveHomeAdminSettings,
  type HomeAdminSettings,
} from "@/lib/homeSettings";

const ADMIN_PASSWORD = "247398";

type ContactMessage = {
  id: number;
  name: string;
  email: string;
  subject?: string;
  message: string;
  createdAt: string;
};

async function uploadAdminImage(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "webp";
  const presignResponse = await fetch("/api/storage/presign-put", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: `admin-home-${Date.now()}.${extension}`,
      contentType: file.type || "application/octet-stream",
      size: file.size,
    }),
  });
  const presignData = await presignResponse.json().catch(() => ({}));
  if (!presignResponse.ok || !presignData.uploadUrl || !presignData.url) {
    throw new Error(presignData?.message || "Fotoğraf yükleme adresi alınamadı");
  }

  const uploadResponse = await fetch(presignData.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!uploadResponse.ok) throw new Error("Fotoğraf yüklenemedi");
  return String(presignData.url);
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(() => window.sessionStorage.getItem("llinktr.admin") === "1");
  const [settings, setSettings] = useState<HomeAdminSettings>(() => readHomeAdminSettings());
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    if (unlocked) window.sessionStorage.setItem("llinktr.admin", "1");
  }, [unlocked]);

  const loadMessages = async () => {
    setMessagesLoading(true);
    try {
      const response = await fetch("/api/contact-messages", {
        headers: { "x-admin-password": ADMIN_PASSWORD },
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

  useEffect(() => {
    if (!unlocked) return;

    void loadMessages();
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
      const nextSettings = await saveHomeAdminSettings(settings, ADMIN_PASSWORD);
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
      const nextSettings = await saveHomeAdminSettings(defaultHomeAdminSettings, ADMIN_PASSWORD);
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
      const url = await uploadAdminImage(file);
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
        headers: { "x-admin-password": ADMIN_PASSWORD },
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
            onSubmit={(event) => {
              event.preventDefault();
              if (password === ADMIN_PASSWORD) setUnlocked(true);
              else toast.error("Admin şifresi hatalı");
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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(340px,0.8fr)]">
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
        </div>

        <section className="mt-6 rounded-[18px] border border-white/10 bg-card p-5">
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
        </section>
      </main>
      <Footer />
    </div>
  );
}
