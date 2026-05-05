import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { ImagePlus, Lock, Save, RotateCcw } from "lucide-react";
import { HOME_ADMIN_SETTINGS_KEY, defaultHomeAdminSettings, readHomeAdminSettings, type HomeAdminSettings } from "@/lib/homeSettings";

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Dosya okunamadı")));
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(() => window.sessionStorage.getItem("llinktr.admin") === "1");
  const [settings, setSettings] = useState<HomeAdminSettings>(() => readHomeAdminSettings());

  useEffect(() => {
    if (unlocked) window.sessionStorage.setItem("llinktr.admin", "1");
  }, [unlocked]);

  const update = (patch: Partial<HomeAdminSettings>) => setSettings((current) => ({ ...current, ...patch }));

  const save = () => {
    window.localStorage.setItem(HOME_ADMIN_SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event("llinktr-home-settings"));
    toast.success("Ana sayfa ayarları kaydedildi");
  };

  const reset = () => {
    setSettings(defaultHomeAdminSettings);
    window.localStorage.removeItem(HOME_ADMIN_SETTINGS_KEY);
    window.dispatchEvent(new Event("llinktr-home-settings"));
    toast.success("Ana sayfa varsayılana döndü");
  };

  const handleImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen görsel dosyası seçin");
      return;
    }
    if (file.size > 1_500_000) {
      toast.error("Hız için görsel en fazla 1.5 MB olmalı");
      return;
    }
    update({ heroImage: await fileToDataUrl(file) });
    toast.success("Görsel eklendi, kaydetmeyi unutma");
  };

  if (!unlocked) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="container flex flex-1 items-center justify-center py-16">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (password === "247398") setUnlocked(true);
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
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
              Sıfırla
            </Button>
            <Button onClick={save} className="bg-primary font-bold text-primary-foreground">
              <Save className="h-4 w-4" />
              Kaydet
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
                  <span className="text-sm font-semibold">Fotoğraf ekle veya değiştir</span>
                  <span className="mt-1 text-xs text-muted-foreground">PNG, JPG veya WebP. Hız için 1.5 MB altı.</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={(event) => void handleImage(event.target.files?.[0])} />
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
      </main>
      <Footer />
    </div>
  );
}
