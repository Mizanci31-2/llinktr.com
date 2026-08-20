import { Link } from "wouter";
import { ArrowRight, Check, Link2, QrCode, Sparkles, UserRound } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

type FeatureKind = "bio" | "shortener" | "qr";

const featureData: Record<FeatureKind, {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Sparkles;
  bullets: string[];
  cta: string;
}> = {
  bio: {
    eyebrow: "Bio Düzenleyici",
    title: "Tüm bağlantılarınızı tek bio link sayfasında toplayın",
    description: "Sosyal medya, mağaza, WhatsApp, konum, görsel ve özel linklerinizi mobil uyumlu tek sayfada düzenleyin.",
    icon: UserRound,
    bullets: ["Sürükle bırak link sıralama", "Canlı önizleme", "Tema ve renk seçenekleri", "Sosyal medya ikonları"],
    cta: "Bio Link Oluştur",
  },
  shortener: {
    eyebrow: "Link Kısaltıcı",
    title: "Uzun bağlantıları kısa ve paylaşılabilir linklere dönüştürün",
    description: "Kampanya, sosyal medya ve satış linklerinizi kısa, okunabilir ve takip edilebilir bağlantılar haline getirin.",
    icon: Link2,
    bullets: ["Kısa link oluşturma", "Özel kısa kod desteği", "Tıklama takibi", "Tek panelden yönetim"],
    cta: "Link Kısaltıcıyı Kullan",
  },
  qr: {
    eyebrow: "QR Oluşturucu",
    title: "Linkleriniz ve iletişim bilgileriniz için QR kod oluşturun",
    description: "Web linki, WhatsApp, e-posta, telefon ve metinler için hızlıca QR kod üretin ve paylaşın.",
    icon: QrCode,
    bullets: ["URL ve metin QR kodları", "WhatsApp ve e-posta desteği", "Hızlı indirme", "Mobil uyumlu kullanım"],
    cta: "QR Oluştur",
  },
};

export default function FeatureLanding({ kind }: { kind: FeatureKind }) {
  const item = featureData[kind];
  const Icon = item.icon;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-white/10 px-4 py-16 md:py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[10%] top-[12%] h-72 w-72 rounded-full bg-primary/12 blur-3xl" />
            <div className="absolute right-[8%] top-[10%] h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
          </div>

          <div className="container relative">
            <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                  <Sparkles className="h-4 w-4" />
                  {item.eyebrow}
                </div>
                <h1 className="max-w-3xl text-4xl font-black leading-tight text-white md:text-6xl">{item.title}</h1>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/68 md:text-lg">{item.description}</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/kayit">
                    <Button className="h-12 gap-2 bg-primary px-6 font-extrabold text-black hover:bg-primary/90">
                      {item.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="h-12 border-white/15 bg-white/5 px-6 font-bold text-white hover:bg-white/10">
                      Ana Sayfaya Dön
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/12 bg-[#111]/90 p-6 shadow-2xl">
                <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                  <Icon className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-bold text-white">Öne çıkanlar</h2>
                <div className="mt-5 space-y-3">
                  {item.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/75">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
