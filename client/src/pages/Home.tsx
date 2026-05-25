import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NativeAdSlot from "@/components/ads/NativeAdSlot";
import { SocialIcon } from "@/components/SocialIcon";
import { readHomeAdminSettings, type HomeAdminSettings } from "@/lib/homeSettings";
import {
  ArrowRight,
  Check,
  Clock3,
  Palette,
  Rocket,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  UserRound,
  Zap,
} from "lucide-react";

const viewport = { once: true, amount: 0.2 };
const transition = { duration: 0.68, ease: "easeOut" as const };

const howItWorks = [
  { title: "Kullanıcı adı al", desc: "Bio adresini seç, sayfan anında hazır olsun.", icon: UserRound },
  { title: "Linklerini ekle", desc: "Sosyal medya, mağaza, WhatsApp ve teklif linklerini sırala.", icon: Share2 },
  { title: "Paylaş ve kazan", desc: "Tek linkle daha fazla tıklama ve satış fırsatı yakala.", icon: Rocket },
];

const whyItems = [
  { title: "Hızlı kurulum", desc: "Dakikalar değil, saniyeler içinde yayına çık.", icon: Zap },
  { title: "Ücretsiz kullanım", desc: "Başlamak için kredi kartı veya ödeme gerekmez.", icon: ShieldCheck },
  { title: "Mobil uyum", desc: "Tek elle kullanıma uygun, hızlı açılan sayfalar.", icon: Smartphone },
  { title: "Modern tasarım", desc: "Koyu tema, net CTA ve premium görünüm.", icon: Palette },
];

const heroInfoCards = [
  "Canli onizleme",
  "Mobil uyumlu",
  "Tek panelden yonet",
  "10 saniyede hazir",
];

const useCases = [
  { title: "Influencer", desc: "İş birlikleri, son içerikler ve sosyal hesaplar tek akışta.", tag: "İçerik" },
  { title: "E-ticaret", desc: "Ürün, kampanya, WhatsApp ve mağaza linklerini öne çıkar.", tag: "Satış" },
  { title: "Freelancer", desc: "Portfolyo, teklif al ve randevu linklerini düzenli göster.", tag: "Lead" },
];

const examples = [
  {
    title: "Creator Kit",
    handle: "@ececreator",
    bio: "Yeni video, iş birliği ve sosyal hesaplar",
    accent: "from-pink-500/22",
    links: ["Instagram içeriklerim", "YouTube videolarım", "Sponsor teklif al"],
    socials: ["instagram", "youtube", "tiktok"],
  },
  {
    title: "Shop Launch",
    handle: "@shoplaunch",
    bio: "Yeni ürünler, kampanya ve hızlı sipariş",
    accent: "from-lime-400/22",
    links: ["Yeni koleksiyon", "WhatsApp sipariş", "İndirim linki"],
    socials: ["instagram", "whatsapp", "website"],
  },
  {
    title: "Portfolio Pro",
    handle: "@dilanworks",
    bio: "Projeler, teklif formu ve toplantı linki",
    accent: "from-sky-400/22",
    links: ["Portfolyo", "Teklif al", "Toplantı planla"],
    socials: ["website", "linkedin", "mail"],
  },
];

const testimonials = [
  { name: "Ece", role: "İçerik üreticisi", text: "Sayfam dolu ve temiz görünüyor. Takipçilerim doğru linke daha hızlı gidiyor." },
  { name: "Mert", role: "E-ticaret", text: "WhatsApp ve mağaza linklerini tek yerde topladım. Satış akışı çok daha net oldu." },
  { name: "Dilan", role: "Freelancer", text: "Portfolyo ve teklif linklerim artık profesyonel duruyor. Paylaşması da kolay." },
];

function Reveal({ children, direction = "up", className = "" }: { children: React.ReactNode; direction?: "right" | "up"; className?: string }) {
  const initial = direction === "right" ? { opacity: 0, x: 42 } : { opacity: 0, y: 36 };
  return (
    <motion.div initial={initial} whileInView={{ opacity: 1, x: 0, y: 0 }} viewport={viewport} transition={transition} className={className}>
      {children}
    </motion.div>
  );
}

function SectionTitle({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <Reveal direction="right" className="mb-10 max-w-2xl">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
      <h2 className="text-3xl font-bold text-white md:text-4xl">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/58 md:text-base">{desc}</p>
    </Reveal>
  );
}

function BioExamplePhone({ item }: { item: (typeof examples)[number] }) {
  return (
    <div className={`premium-card rounded-[18px] border border-white/10 bg-gradient-to-br ${item.accent} to-[#111] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_0_50px_rgba(213,255,32,0.12)]`}>
      <div className="mx-auto max-w-[245px] rounded-[30px] border border-white/12 bg-black p-2 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <div className="relative overflow-hidden rounded-[24px] border border-white/8 bg-[#080808] px-4 pb-5 pt-9">
          <div className="absolute left-1/2 top-0 h-5 w-20 -translate-x-1/2 rounded-b-2xl bg-black" />
          <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,#dfff0033,transparent_65%)]" />
          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/45 bg-primary/12 text-lg font-black text-primary shadow-[0_0_34px_rgba(223,255,0,0.14)]">
              ll
            </div>
            <div className="mt-4 text-center">
              <p className="text-base font-bold text-white">{item.handle}</p>
              <p className="mx-auto mt-1 max-w-[180px] text-xs leading-relaxed text-white/58">{item.bio}</p>
            </div>
            <div className="mt-5 space-y-2.5">
              {item.links.map((link) => (
                <div key={link} className="grid min-h-11 grid-cols-[1.75rem_minmax(0,1fr)_0.75rem] items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.075] px-3 text-xs font-semibold text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-black">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                  <span className="truncate text-center">{link}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary" />
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-center gap-2">
              {item.socials.map((platform) => (
                <span key={platform} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/45">
                  <SocialIcon platform={platform} size={18} />
                </span>
              ))}
            </div>
            <div className="mt-5 flex min-h-10 items-center justify-center rounded-2xl border border-primary/30 bg-primary/12 px-3 text-xs font-bold text-primary">
              llinktr.com/{item.handle.replace("@", "")}
            </div>
          </div>
        </div>
      </div>
      <h3 className="mt-5 text-xl font-bold text-white">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/58">{item.bio}</p>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [adminSettings, setAdminSettings] = useState<HomeAdminSettings>(() => readHomeAdminSettings());
  const targetHref = isAuthenticated ? "/dashboard" : "/register";

  useEffect(() => {
    const refresh = () => setAdminSettings(readHomeAdminSettings());
    window.addEventListener("storage", refresh);
    window.addEventListener("llinktr-home-settings", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("llinktr-home-settings", refresh);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-white/8 pb-14 pt-10 md:pb-20 md:pt-20">
          <div className="absolute inset-0 landing-surface" aria-hidden />
          <div className="absolute right-[8%] top-[10%] h-96 w-96 rounded-full bg-primary/16 blur-3xl" aria-hidden />
          <div className="absolute left-[8%] bottom-[10%] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden />

          <div className="container relative">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
              <Reveal direction="right">
                <div className="max-w-3xl">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    {adminSettings.heroProof}
                  </div>
                  <h1 className="text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
                    {adminSettings.heroTitle}
                  </h1>
                  <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/66 sm:text-xl">
                    {adminSettings.heroSubtitle}
                  </p>

                  <div className="mt-8 max-w-xl rounded-[18px] border border-white/10 bg-[#111]/90 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.25)] backdrop-blur">
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <div className="flex min-h-14 items-center rounded-[14px] border border-white/8 bg-black/30 px-4">
                        <span className="mr-1 text-sm text-white/35">llinktr.com/</span>
                        <input
                          aria-label="Kullanıcı adı"
                          value={username}
                          onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                          placeholder="kullaniciadi"
                          className="min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none placeholder:text-white/30"
                        />
                      </div>
                      <Link href={targetHref}>
                        <Button size="lg" className="h-14 w-full rounded-[14px] bg-primary px-7 font-bold text-primary-foreground shadow-[0_0_34px_rgba(223,255,0,0.25)] transition-transform active:scale-[0.98] sm:w-auto">
                          Ücretsiz Başla
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium text-white/48">Kayıt olmadan önizle</p>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {["Ücretsiz", "Mobil hazır", "Tek panel"].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-semibold text-white/72 backdrop-blur">
                        <Check className="mb-2 h-4 w-4 text-primary" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal className="relative">
                <div className="absolute -inset-8 rounded-[2rem] bg-primary/14 blur-3xl" aria-hidden />
                <div className="pointer-events-none absolute -left-4 top-8 z-10 hidden max-w-[160px] rounded-2xl border border-white/10 bg-white/[0.075] px-4 py-3 text-xs font-semibold text-white/82 shadow-2xl backdrop-blur md:block">
                  {heroInfoCards[0]}
                </div>
                <div className="pointer-events-none absolute -right-3 top-24 z-10 hidden max-w-[160px] rounded-2xl border border-primary/20 bg-primary/[0.09] px-4 py-3 text-xs font-semibold text-white/82 shadow-2xl backdrop-blur lg:block">
                  {heroInfoCards[1]}
                </div>
                <div className="pointer-events-none absolute -left-2 bottom-24 z-10 hidden max-w-[180px] rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-xs font-semibold text-white/82 shadow-2xl backdrop-blur md:block">
                  {heroInfoCards[2]}
                </div>
                <div className="pointer-events-none absolute right-10 bottom-5 z-10 hidden max-w-[160px] rounded-2xl border border-white/10 bg-[#101010]/75 px-4 py-3 text-xs font-semibold text-white/82 shadow-2xl backdrop-blur sm:block">
                  {heroInfoCards[3]}
                </div>
                <motion.img
                  src={adminSettings.heroImage}
                  alt="llinktr ana sayfa bio önizlemesi"
                  loading="eager"
                  decoding="async"
                  className="relative mx-auto w-full max-w-[560px] rounded-[24px] border border-white/10 object-cover shadow-[0_30px_95px_rgba(0,0,0,0.52)]"
                  whileHover={{ y: -8, scale: 1.01 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              </Reveal>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container">
            <SectionTitle eyebrow="Nasıl çalışır?" title="Üç adımda yayına çık" desc="Karmaşık ayarlar yok. Kullanıcı adını al, linklerini ekle, paylaşmaya başla." />
            <div className="grid gap-4 md:grid-cols-3">
              {howItWorks.map((item, index) => (
                <Reveal key={item.title}>
                  <div className="premium-card h-full rounded-[18px] border border-white/10 bg-[#111] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35">
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-black text-black">0{index + 1}</span>
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mt-8 text-xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">{item.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/8 bg-[#0d0d0d] py-16 md:py-24">
          <div className="container">
            <SectionTitle eyebrow="Neden llinktr?" title="Bio link aracı değil, sade bir satış paneli" desc="Hızlı, ücretsiz, mobil uyumlu ve modern. Kullanıcı sayfayı düşünmeden kullanır." />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {whyItems.map((item) => (
                <Reveal key={item.title}>
                  <div className="premium-card h-full rounded-[18px] border border-white/10 bg-[#151515] p-5 transition-all duration-300 hover:border-primary/35">
                    <item.icon className="h-6 w-6 text-primary" />
                    <h3 className="mt-5 text-base font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">{item.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <NativeAdSlot placement="home-middle" className="py-8 md:py-10" />

        <section className="py-16 md:py-24">
          <div className="container">
            <SectionTitle eyebrow="Kullanım alanları" title="Her profil için dolu bir vitrin" desc="İçerik üreticilerinden mağazalara kadar herkes için net bir ilk ekran." />
            <div className="grid gap-4 md:grid-cols-3">
              {useCases.map((item) => (
                <Reveal key={item.title}>
                  <div className="template-card group min-h-64 overflow-hidden rounded-[18px] border border-white/10 bg-[#151515] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35">
                    <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{item.tag}</span>
                    <h3 className="mt-20 text-2xl font-bold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/55">{item.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/8 bg-[#0d0d0d] py-16 md:py-24">
          <div className="container">
            <SectionTitle eyebrow="Örnek bio sayfalar" title="Gerçek telefon görünümünde hazır sayfalar" desc="Her kart farklı bir kullanım senaryosunu gerçek bir mobil bio sayfası gibi gösterir." />
            <div className="grid gap-4 md:grid-cols-3">
              {examples.map((item) => (
                <Reveal key={item.title}>
                  <BioExamplePhone item={item} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container">
            <SectionTitle eyebrow="Yorumlar" title="Kullanıcıların beklediği kadar basit" desc="Sade akış, net CTA ve mobil öncelikli tasarım daha iyi dönüşüm sağlar." />
            <div className="grid gap-4 md:grid-cols-3">
              {testimonials.map((item) => (
                <Reveal key={item.name}>
                  <div className="premium-card h-full rounded-[18px] border border-white/10 bg-[#111] p-6">
                    <div className="mb-4 flex gap-1 text-primary">
                      {[0, 1, 2, 3, 4].map((star) => <Star key={star} className="h-4 w-4 fill-current" />)}
                    </div>
                    <p className="text-sm leading-relaxed text-white/68">"{item.text}"</p>
                    <div className="mt-6 border-t border-white/10 pt-4">
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-xs text-white/45">{item.role}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="container">
            <Reveal>
              <div className="overflow-hidden rounded-[18px] border border-primary/20 bg-[#151515] px-6 py-10 text-center shadow-[0_0_70px_rgba(223,255,0,0.1)] md:px-10 md:py-14">
                <Clock3 className="mx-auto mb-5 h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold text-white md:text-5xl">Şimdi başla</h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/58 md:text-base">Bio sayfanı oluştur, linklerini sırala ve takipçini müşteriye çevirmeye başla.</p>
                <Link href={targetHref}>
                  <Button size="lg" className="mt-8 h-13 rounded-[14px] bg-primary px-8 font-bold text-primary-foreground">
                    Ücretsiz Başla
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
