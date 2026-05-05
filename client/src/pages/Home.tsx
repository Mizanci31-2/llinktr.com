import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SocialIcon } from "@/components/SocialIcon";
import {
  ArrowRight,
  Check,
  Clock3,
  Palette,
  QrCode,
  Rocket,
  Share2,
  ShieldCheck,
  ShoppingBag,
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
  { title: "Mobil uyum", desc: "Tek elle kullanılabilen, hızlı açılan sayfalar.", icon: Smartphone },
  { title: "Modern tasarım", desc: "Koyu tema, net CTA ve premium görünüm.", icon: Palette },
];

const useCases = [
  { title: "Influencer", desc: "İş birlikleri, son içerikler ve sosyal hesaplar tek akışta.", tag: "İçerik" },
  { title: "E-ticaret", desc: "Ürün, kampanya, WhatsApp ve mağaza linklerini öne çıkar.", tag: "Satış" },
  { title: "Freelancer", desc: "Portfolyo, teklif al ve randevu linklerini düzenli göster.", tag: "Lead" },
];

const examples = [
  { title: "Creator Kit", desc: "Instagram, YouTube, kampanya ve sponsor linkleri.", color: "from-pink-500/24" },
  { title: "Shop Launch", desc: "Yeni ürün, indirim ve WhatsApp sipariş akışı.", color: "from-lime-400/24" },
  { title: "Portfolio Pro", desc: "Projeler, teklif formu ve toplantı linki.", color: "from-sky-400/24" },
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

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      <div className="absolute -inset-10 rounded-full bg-primary/20 blur-3xl" aria-hidden />
      <motion.div
        className="relative rounded-[34px] border border-white/12 bg-white/[0.055] p-3 shadow-[0_30px_110px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
        initial={{ opacity: 0, x: 44, y: 16 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.75, ease: "easeOut" }}
        whileHover={{ y: -8, scale: 1.015 }}
      >
        <div className="overflow-hidden rounded-[27px] border border-white/10 bg-[#090909]">
          <div className="absolute left-1/2 top-3 z-10 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-black" />
          <div className="min-h-[590px] bg-[radial-gradient(circle_at_top,#dfff0033,transparent_35%),linear-gradient(180deg,#161616,#080808)] px-5 pb-6 pt-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-primary/45 bg-primary/12 shadow-[0_0_40px_rgba(223,255,0,0.16)]">
              <span className="text-xl font-black text-primary">ll</span>
            </div>
            <div className="mt-4 text-center">
              <p className="text-lg font-bold text-white">@kullaniciadi</p>
              <p className="mt-1 text-sm leading-relaxed text-white/58">Satış, içerik ve tüm önemli linkler</p>
            </div>

            <div className="mt-7 space-y-3">
              {["Yeni koleksiyon", "WhatsApp ile teklif al", "YouTube videolarım"].map((item) => (
                <div key={item} className="grid min-h-14 grid-cols-[2rem_minmax(0,1fr)_1rem] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.075] px-4 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-black">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  <span className="truncate text-center">{item}</span>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              ))}
            </div>

            <div className="mt-7 flex justify-center gap-3">
              {['instagram', 'youtube', 'tiktok', 'whatsapp'].map((platform) => (
                <span key={platform} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <SocialIcon platform={platform} size={20} />
                </span>
              ))}
            </div>

            <a href="/register" className="mt-7 flex min-h-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/12 px-4 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-black">
              llinktr.com/kullaniciadi
            </a>
          </div>
        </div>
      </motion.div>
    </div>
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

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const targetHref = isAuthenticated ? "/dashboard" : "/register";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-white/8 pb-14 pt-10 md:pb-20 md:pt-20">
          <div className="absolute inset-0 landing-surface" aria-hidden />
          <div className="absolute right-[4%] top-[8%] h-80 w-80 rounded-full bg-primary/15 blur-3xl" aria-hidden />
          <div className="absolute left-[8%] bottom-[10%] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden />

          <div className="container relative">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,1.08fr)]">
              <Reveal direction="right">
                <div className="max-w-3xl">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    +150 kullanıcı • 250+ link • büyüyor
                  </div>
                  <h1 className="text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
                    Tüm linklerini tek sayfada topla
                  </h1>
                  <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/66 sm:text-xl">
                    Takipçini müşteriye çevir. Bio sayfanı saniyeler içinde oluştur.
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

              <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(260px,0.72fr)] lg:items-center">
                <Reveal className="relative order-2 lg:order-1">
                  <div className="absolute -inset-6 rounded-[2rem] bg-primary/12 blur-3xl" aria-hidden />
                  <img
                    src="/images/hero-preview-1.png"
                    alt="llinktr bio sayfası önizlemesi"
                    loading="eager"
                    decoding="async"
                    className="relative w-full rounded-[26px] border border-white/10 shadow-[0_32px_100px_rgba(0,0,0,0.48)]"
                  />
                </Reveal>
                <div className="order-1 lg:order-2">
                  <PhoneMockup />
                </div>
              </div>
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
            <SectionTitle eyebrow="Örnek bio sayfalar" title="Boş değil, hazır ve canlı hissettiren sayfalar" desc="Her kart farklı bir kullanım senaryosunu gösterir; kullanıcı kendi sayfasını hayal eder." />
            <div className="grid gap-4 md:grid-cols-3">
              {examples.map((item) => (
                <Reveal key={item.title}>
                  <div className={`premium-card rounded-[18px] border border-white/10 bg-gradient-to-br ${item.color} to-[#111] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35`}>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="mx-auto h-14 w-14 rounded-full border border-primary/35 bg-primary/15" />
                      <div className="mt-5 space-y-2">
                        <div className="h-10 rounded-xl bg-white/10" />
                        <div className="h-10 rounded-xl bg-white/10" />
                        <div className="h-10 rounded-xl bg-primary/18" />
                      </div>
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/58">{item.desc}</p>
                  </div>
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
                    <p className="text-sm leading-relaxed text-white/68">“{item.text}”</p>
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