import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SocialIcon } from "@/components/SocialIcon";
import {
  COMMERCE_LINK_PRESETS,
  getBioButtonStyle,
  getBioCardStyle,
  getBioTheme,
  getBioThemePreviewStyle,
  safeAccentColor,
} from "@/lib/constants";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Link2,
  QrCode,
  Sparkles,
} from "lucide-react";

type FeatureDefinition = {
  icon: typeof LayoutDashboard;
  title: string;
  desc: string;
  color: string;
  bg: string;
  themeId: string;
  cta: string;
  href: string;
  authOnly?: boolean;
  bullets: string[];
  preview: {
    title: string;
    description: string;
    links: Array<{ label: string; logo: string }>;
    socials: string[];
  };
};

const FEATURES: readonly FeatureDefinition[] = [
  {
    icon: LayoutDashboard,
    title: "Bio Link",
    desc: "Tum linklerinizi tek profil kartinda toplayin, blok bazli duzenleyin, sosyal hesaplari alta yuvarlak ikonlarla yerlestirin ve yayina almadan once canli onizleme ile kontrol edin.",
    color: "text-primary",
    bg: "bg-primary/10",
    themeId: "dark_grid",
    cta: "Bio Link Olustur",
    href: "/dashboard",
    bullets: ["Tema sec", "Blok ekle", "Profil resmi", "Canli onizleme", "Paylas"],
    preview: {
      title: "Koleksiyon",
      description: "Yeni sezon vitrini",
      links: [
        { label: "Yeni koleksiyon", logo: "trendyol" },
        { label: "Magaza vitrini", logo: "shopier_store" },
        { label: "Favori urunler", logo: "hepsiburada" },
        { label: "Kampanya indirimi", logo: "n11" },
      ],
      socials: ["instagram", "tiktok", "youtube"],
    },
  },
  {
    icon: Link2,
    title: "Link Kisaltma",
    desc: "Uzun baglantilari okunabilir kisaltin, istediginizde silin, ozel kisa ad kullanin ve tiklama analiziyle hangi kampanyanin daha iyi dondugunu takip edin.",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    themeId: "minimal_light",
    cta: "Kisa Linke Git",
    href: "/shortener",
    authOnly: true,
    bullets: ["Kisa ad", "Silme", "Uzun URL", "Tiklama analizi", "Hizli kopya"],
    preview: {
      title: "Kisa linkler",
      description: "Kampanya akisi ve yonlendirme",
      links: [
        { label: "yeni-sezon", logo: "amazon_store" },
        { label: "bahar-kodlari", logo: "ebay_store" },
        { label: "kampanya-2026", logo: "n11" },
        { label: "toplu-liste", logo: "pttavm" },
      ],
      socials: ["linkedin", "github", "telegram"],
    },
  },
  {
    icon: QrCode,
    title: "QR Kod",
    desc: "Baglantilarinizi QR kod ile saniyeler icinde dagitin, fuar, masa ustu, paket ve vitrin gibi fiziksel alanlarda tek taramada mobil trafigi hizlandirin.",
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-400/10",
    themeId: "soft_gradient",
    cta: "QR Ekrani",
    href: "/qr",
    authOnly: true,
    bullets: ["Anlik olustur", "Temiz gorunum", "Mobilden tara", "PNG indir", "Hizli paylas"],
    preview: {
      title: "QR akisi",
      description: "Etkinlik ve stand akisi",
      links: [
        { label: "Stand katalogu", logo: "pazarama" },
        { label: "Anlik kampanya", logo: "ciceksepeti" },
        { label: "Ziyaretci formu", logo: "pttavm" },
        { label: "Tanitim videosu", logo: "youtube" },
      ],
      socials: ["whatsapp", "telegram", "facebook"],
    },
  },
] as const;

const FAQS = [
  { q: "llinktr tamamen ucretsiz mi?", a: "Evet, temel ozellikler tamamen ucretsizdir. Bio link olusturma, link kisaltma ve QR kod uretme ozelliklerini ucretsiz kullanabilirsiniz." },
  { q: "Kac tane bio sayfasi olusturabilirim?", a: "Istediginiz kadar bio sayfasi olusturabilirsiniz. Her sayfa icin benzersiz bir slug belirleyebilirsiniz." },
  { q: "Bio sayfama kac oge ekleyebilirim?", a: "Her bio sayfasina maksimum 50 oge ekleyebilirsiniz. Baslik, aciklama, link, sosyal medya baglantisi ve daha fazlasini ekleyebilirsiniz." },
  { q: "QR kodlarini sonradan duzenleyebilir miyim?", a: "QR kodlari anlik olarak olusturulur ve PNG formatinda indirilebilir. Her zaman yeni bir QR kod olusturabilirsiniz." },
] as const;

const HOME_QR_TARGET = "https://www.google.com/";

function HomeQrPreview() {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    import("qrcode")
      .then((module) => module.default.toDataURL(HOME_QR_TARGET, {
        width: 260,
        margin: 2,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF",
        },
      }))
      .then((dataUrl) => {
        if (mounted) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (mounted) setQrDataUrl("");
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <a href={HOME_QR_TARGET} target="_blank" rel="noreferrer" className="block">
      <div className="rounded-[1.8rem] border border-white/20 bg-white/95 p-5 shadow-2xl">
        <div className="mx-auto mb-4 flex h-44 w-44 items-center justify-center rounded-2xl bg-white shadow-inner ring-1 ring-slate-200">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR onizlemesi" className="h-[10.5rem] w-[10.5rem] rounded-xl object-contain" />
          ) : (
            <QrCode className="h-12 w-12 text-slate-300" />
          )}
        </div>
        <div className="space-y-2">
          <div className="rounded-full border px-4 py-2 text-center text-xs font-medium text-slate-800">Stand afisi</div>
          <div className="rounded-full border px-4 py-2 text-center text-xs font-medium text-slate-800">Masa uzeri kart</div>
          <div className="rounded-full border px-4 py-2 text-center text-xs font-medium text-slate-800">Paket ici yonlendirme</div>
        </div>
      </div>
    </a>
  );
}

function HeroPhone({
  themeId,
  title,
  description,
  links,
  socials,
  className = "",
}: {
  themeId: string;
  title: string;
  description: string;
  links: Array<{ label: string; logo: string }>;
  socials: string[];
  className?: string;
}) {
  const theme = getBioTheme(themeId);
  const accent = safeAccentColor(theme.accent, theme.accent);
  const buttonStyle = getBioButtonStyle(theme, accent);
  const resolveLogo = (platform: string) => COMMERCE_LINK_PRESETS.find(item => item.id === platform);

  return (
    <div className={`relative w-[262px] md:w-[304px] ${className}`}>
      <div className="relative overflow-hidden rounded-[2.6rem] border-2 border-white/15 bg-[#09090b] shadow-2xl">
        <div className="absolute left-1/2 top-0 z-10 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-black" />
        <div className="min-h-[560px] px-3.5 pt-8 pb-4.5" style={getBioThemePreviewStyle(theme, accent)}>
          <div className="min-h-[500px] rounded-[2rem] border p-5" style={getBioCardStyle(theme)}>
            <div className="mb-6 flex flex-col items-center gap-3.5">
              <div className="flex h-[4.9rem] w-[4.9rem] items-center justify-center rounded-full border-2 border-white/20 bg-white/10">
                <span className="text-xl font-semibold" style={{ color: theme.text }}>ll</span>
              </div>
              <div className="text-center">
                <p className="text-[15px] font-semibold" style={{ color: theme.text }}>{title}</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: theme.mutedText }}>{description}</p>
              </div>
            </div>

            <div className="space-y-3">
              {links.map((item) => (
                <div key={item.label} className="rounded-[1.05rem] border px-4 py-3.5" style={buttonStyle}>
                  <div className="relative flex min-h-[2rem] items-center justify-center">
                    <div className="absolute left-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/80">
                      {resolveLogo(item.logo)?.logoUrl ? (
                        <img src={resolveLogo(item.logo)?.logoUrl} alt="" className="h-[18px] w-[18px] rounded-full object-cover" />
                      ) : (
                        <SocialIcon platform={item.logo} size={18} />
                      )}
                    </div>
                    <span className="block w-full truncate px-10 text-center text-[13px] font-medium">{item.label}</span>
                    <ArrowRight className="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-55" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center gap-2.5">
              {socials.map((platform) => (
                <div key={platform} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ background: theme.cardBg, borderColor: theme.cardBorder }}>
                  <SocialIcon platform={platform} size={18} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureVisual({
  feature,
}: {
  feature: (typeof FEATURES)[number];
}) {
  const visualByTitle: Record<string, string> = {
    "Bio Link":
      "linear-gradient(rgba(2,6,23,0.26), rgba(2,6,23,0.58)), url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&crop=entropy&w=2000&h=1320&q=80') center/cover no-repeat",
    "Link Kisaltma":
      "linear-gradient(rgba(2,6,23,0.3), rgba(2,6,23,0.58)), url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&crop=entropy&w=2000&h=1320&q=80') center/cover no-repeat",
    "QR Kod":
      "linear-gradient(rgba(2,6,23,0.18), rgba(2,6,23,0.4)), url('https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&crop=entropy&w=2000&h=1320&q=80') center/cover no-repeat",
  };

  if (feature.title === "Bio Link") {
    return (
      <div className="relative overflow-hidden rounded-[1.7rem] border border-border/40 px-4 py-8 md:px-6" style={{ background: visualByTitle[feature.title] }}>
        <div className="relative flex justify-center">
          <HeroPhone
            themeId={feature.themeId}
            title={feature.preview.title}
            description={feature.preview.description}
            links={feature.preview.links}
            socials={feature.preview.socials}
            className="mx-auto w-[252px] md:w-[300px]"
          />
        </div>
      </div>
    );
  }

  if (feature.title === "Link Kisaltma") {
    return (
      <div className="relative overflow-hidden rounded-[1.7rem] border border-border/40 p-5 md:p-6" style={{ background: visualByTitle[feature.title] }}>
        <div className="mx-auto max-w-[31rem] rounded-[1.4rem] border border-white/20 bg-slate-950/72 p-4 backdrop-blur">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70">
              yonlendirme paneli
            </div>
          </div>
          <div className="mb-4 grid gap-3 md:grid-cols-[1.4fr_0.8fr]">
            <div className="rounded-2xl border border-cyan-400/25 bg-slate-950/70 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/70">Uzun URL</p>
              <p className="mt-2 truncate rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85">
                https://magaza.example.com/kampanyalar/yeni-sezon/indirim-2026/urun-koleksiyonu
              </p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-cyan-200/70">Kisa baglanti</p>
              <div className="mt-2 flex items-center justify-between rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2.5">
                <span className="truncate text-sm font-medium text-cyan-50">llinktr.co/yeni-sezon</span>
                <ArrowRight className="h-4 w-4 text-cyan-200" />
              </div>
            </div>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] text-white/60">Tiklama</p>
                <p className="mt-1 text-2xl font-semibold text-white">1.284</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] text-white/60">Kopyalama</p>
                <p className="mt-1 text-2xl font-semibold text-white">326</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {feature.preview.links.map((item) => (
              <div key={item.label} className="grid grid-cols-[2.25rem_minmax(0,1fr)_1rem] items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/90">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xs font-semibold text-cyan-200">
                  /r
                </div>
                <span className="truncate text-sm font-medium">{item.label}</span>
                <ArrowRight className="h-4 w-4 opacity-60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[1.7rem] border border-border/40 p-5 md:p-6" style={{ background: visualByTitle[feature.title] }}>
      <div className="mx-auto flex max-w-[31rem] items-center justify-center">
        <HomeQrPreview />
      </div>
    </div>
  );
}

function FeatureTile({
  feature,
  isAuthenticated,
}: {
  feature: (typeof FEATURES)[number];
  isAuthenticated: boolean;
}) {
  const href = feature.authOnly && !isAuthenticated ? getLoginUrl() : feature.href;

  return (
    <a href={href} className="group rounded-2xl border border-border/50 bg-card/85 p-4 transition-all hover:border-primary/30 hover:bg-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.bg}`}>
          <feature.icon className={`h-5 w-5 ${feature.color}`} />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <p className="text-sm font-semibold">{feature.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{feature.desc}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {feature.bullets.map((item) => (
          <span key={item} className="rounded-full border border-border/50 bg-background/70 px-2.5 py-1 text-[11px] text-muted-foreground">
            {item}
          </span>
        ))}
      </div>
      {feature.authOnly && !isAuthenticated && (
        <p className="mt-3 text-[11px] text-primary">Giris yaptiktan sonra acilir</p>
      )}
    </a>
  );
}

function FeatureShowcase({
  feature,
  isAuthenticated,
  reverse = false,
}: {
  feature: (typeof FEATURES)[number];
  isAuthenticated: boolean;
  reverse?: boolean;
}) {
  const href = feature.authOnly && !isAuthenticated ? getLoginUrl() : feature.href;

  return (
    <div className="grid items-center gap-8 rounded-[2rem] border border-border/50 bg-card p-5 lg:grid-cols-[420px_1fr] lg:p-7">
      <div className={reverse ? "order-2 lg:order-2" : "order-1"}>
        <FeatureVisual feature={feature} />
      </div>

      <div className={reverse ? "order-1 lg:order-1" : "order-2"}>
        <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg}`}>
          <feature.icon className={`h-6 w-6 ${feature.color}`} />
        </div>
        <h3 className="text-2xl font-semibold">{feature.title}</h3>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-[15px]">{feature.desc}</p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          llinktr ile bu alanlari ayni panelde yonetebilir, bio linkinizi, kisa baglantilarinizi ve QR akislarinizi daha duzenli bir sekilde ayni yerden kontrol edebilirsiniz.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {feature.bullets.map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm leading-relaxed">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <a href={href} className="mt-6 inline-flex">
          <Button className="bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90">
            {feature.cta}
          </Button>
        </a>
      </div>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const visibleFeatures = FEATURES;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <section className="relative overflow-hidden border-b border-border/50 pt-20 pb-18 md:pt-28 md:pb-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "linear-gradient(118deg, rgba(250,204,21,0.08) 0%, transparent 26%, rgba(34,211,238,0.1) 54%, transparent 76%), linear-gradient(180deg, rgba(2,6,23,0.18) 0%, rgba(2,6,23,0.72) 100%)",
            }}
          />
          <div
            className="absolute right-[-8%] top-[-12%] h-[24rem] w-[40rem] rotate-[-10deg] opacity-70 blur-3xl"
            style={{
              background:
                "linear-gradient(90deg, rgba(34,211,238,0.18) 0%, rgba(168,85,247,0.24) 42%, rgba(250,204,21,0.18) 100%)",
            }}
          />
          <div
            className="absolute left-[-10%] top-[18%] h-[18rem] w-[32rem] rotate-[8deg] opacity-60 blur-3xl"
            style={{
              background:
                "linear-gradient(90deg, rgba(59,130,246,0.16) 0%, rgba(236,72,153,0.16) 46%, rgba(34,197,94,0.14) 100%)",
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:120px_120px]" />
        </div>

        <div className="container relative">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Tema, bio link, kisa link ve QR ayni panelde
              </div>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                Bio link sayfasi,
                <br />
                <span className="text-primary">kisa link ve QR</span>
                <br />
                tek yerde.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                llinktr ile link sayfanizi kurun, blok blok duzenleyin, temalari aninda degistirin, uzun URL'leri kisaltin ve QR ile paylasin.
                Bio link, sosyal hesaplar, magaza baglantilari ve kampanya linkleri ayni panelde toplansin; siz de yayinlamadan once canli onizleme ile son halini rahatca kontrol edin.
              </p>
              <div className="mt-5 grid max-w-2xl gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/50 bg-card/70 p-4">
                  <p className="text-sm font-semibold">Tek panelden duzenleyin</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Baslik, metin, link, sosyal hesap ve hazir e-ticaret butonlarini ayri ayri yonetip hizlamayi secin.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-card/70 p-4">
                  <p className="text-sm font-semibold">Temayi aninda degistirin</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Fotografli, hareketli ve sade temalar arasinda gecis yapin; bio sayfaniz yayinlanmadan once son halini rahatca kontrol edin.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a href={isAuthenticated ? "/dashboard" : getLoginUrl()}>
                  <Button size="lg" className="bg-primary px-6 font-semibold text-primary-foreground shadow-[0_0_24px_oklch(0.93_0.23_110/0.24)] hover:bg-primary/90">
                    Basla
                  </Button>
                </a>
                {isAuthenticated ? (
                  <Link href="/shortener">
                    <Button size="lg" variant="outline" className="border-border/60 px-6 font-semibold">
                      Link Kisalt
                    </Button>
                  </Link>
                ) : (
                  <a href={getLoginUrl()}>
                    <Button size="lg" variant="outline" className="border-border/60 px-6 font-semibold">
                      Link Kisalt
                    </Button>
                  </a>
                )}
                {isAuthenticated ? (
                  <Link href="/qr">
                    <Button size="lg" variant="outline" className="border-border/60 px-6 font-semibold">
                      QR Olustur
                    </Button>
                  </Link>
                ) : (
                  <a href={getLoginUrl()}>
                    <Button size="lg" variant="outline" className="border-border/60 px-6 font-semibold">
                      QR Olustur
                    </Button>
                  </a>
                )}
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visibleFeatures.map((feature) => (
                  <FeatureTile key={feature.title} feature={feature} isAuthenticated={isAuthenticated} />
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-border/50 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground">Hazir magaza logolari</span>
                <span className="rounded-full border border-border/50 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground">Telefon onizleme</span>
                <span className="rounded-full border border-border/50 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground">Canli tema degisimi</span>
              </div>
            </div>

            <div className="relative flex min-h-[560px] items-center justify-center lg:min-h-[720px] lg:justify-end">
              <HeroPhone
                themeId="minimal_light"
                title="Kurumsal profil"
                description="Teklif, toplanti ve dosya akisi"
                links={[
                  { label: "Toplanti rezervasyonu", logo: "amazon_store" },
                  { label: "Sunum dosyalari", logo: "ebay_store" },
                  { label: "Kurumsal baglanti", logo: "linkedin" },
                  { label: "Pazar yeri listesi", logo: "hepsiburada" },
                ]}
                socials={["linkedin", "github", "telegram"]}
                className="absolute left-[0.5rem] top-20 hidden rotate-[-12deg] opacity-85 md:block lg:left-[1rem]"
              />
              <HeroPhone
                themeId="dark_grid"
                title="Moda vitrini"
                description="Yeni sezon kampanya akisi"
                links={[
                  { label: "Trendyol magazam", logo: "trendyol" },
                  { label: "Shopier koleksiyonu", logo: "shopier_store" },
                  { label: "Hepsiburada urunleri", logo: "hepsiburada" },
                  { label: "N11 kampanyasi", logo: "n11" },
                ]}
                socials={["instagram", "tiktok", "youtube"]}
                className="relative z-10 w-[274px] md:w-[316px] lg:mr-4"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-18">
        <div className="container">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold md:text-4xl">Her hizmet icin hizli bir alan</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Bio linkten QR'a kadar her modulu kendi sahnesiyle hazirladik. Araclar birbirine bagli ama kullanimlari sade.
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            {visibleFeatures.map((feature, index) => (
              <FeatureShowcase key={feature.title} feature={feature} isAuthenticated={isAuthenticated} reverse={index % 2 === 1} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/50 py-20">
        <div className="container max-w-2xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Sikca Sorulan Sorular</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border/50 bg-card">
                <button
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/30"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-medium">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="border-t border-border/30 px-5 pt-3 pb-4 text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
