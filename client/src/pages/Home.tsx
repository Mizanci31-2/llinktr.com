import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ArrowRight,
  BarChart3,
  Check,
  Link2,
  MessageCircle,
  MousePointerClick,
  QrCode,
  ShoppingBag,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";

const viewport = { once: true, amount: 0.22 };
const transition = { duration: 0.7, ease: "easeOut" as const };

const steps = ["Kullanıcı adını seç", "Linklerini ekle", "Paylaş ve kazan"];
const reasons = [
  { title: "Daha fazla tıklama", desc: "Net CTA, hızlı açılış ve mobil odaklı bio sayfaları.", icon: MousePointerClick },
  { title: "Satış odaklı yapı", desc: "WhatsApp, satış linki ve teklif al akışları tek yerde.", icon: ShoppingBag },
  { title: "Analiz sistemi", desc: "Görüntülenme, tıklama ve en iyi link bilgisi panelde.", icon: BarChart3 },
  { title: "Tek panel", desc: "Bio link, link kısaltma ve QR aynı sade çalışma alanında.", icon: Zap },
];
const features = [
  { title: "Bio Link", desc: "Tüm önemli linklerin tek premium sayfada.", icon: UserRound },
  { title: "Link Kısalt", desc: "Kampanyalar için kısa, okunabilir bağlantılar.", icon: Link2 },
  { title: "QR", desc: "Fiziksel dünyadan bio sayfana tek tarama.", icon: QrCode },
];
const templates = [
  { title: "Influencer", desc: "İş birlikleri, sosyal hesaplar, öne çıkan içerikler.", stat: "+38%" },
  { title: "E-ticaret", desc: "Mağaza, ürün, WhatsApp ve kampanya linkleri.", stat: "Satış" },
  { title: "Freelancer", desc: "Portfolyo, teklif al ve randevu bağlantıları.", stat: "Lead" },
];
const testimonials = [
  { name: "Ece", role: "İçerik üreticisi", text: "Bio sayfamı birkaç dakikada toparladım. En çok tıklanan linki görmek çok işime yaradı." },
  { name: "Mert", role: "E-ticaret", text: "WhatsApp ve mağaza linklerini tek düzende verdim. Kullanıcılar daha hızlı aksiyon alıyor." },
  { name: "Dilan", role: "Freelancer", text: "Portfolyo, teklif ve sosyal hesaplar sade bir sayfada duruyor. Premium görünüyor." },
];

function Reveal({ children, direction = "up", className = "" }: { children: React.ReactNode; direction?: "left" | "right" | "up"; className?: string }) {
  const initial = direction === "left" ? { opacity: 0, x: -50 } : direction === "right" ? { opacity: 0, x: 50 } : { opacity: 0, y: 40 };
  return (
    <motion.div initial={initial} whileInView={{ opacity: 1, x: 0, y: 0 }} viewport={viewport} transition={transition} className={className}>
      {children}
    </motion.div>
  );
}

function BioPreview() {
  return (
    <motion.div
      className="landing-phone group relative mx-auto w-full max-w-[390px] rounded-[34px] border border-white/12 bg-white/[0.05] p-3 shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl"
      initial={{ opacity: 0, x: 50, y: 16 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.75, ease: "easeOut" }}
      whileHover={{ y: -8, scale: 1.015 }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[34px] opacity-0 transition-opacity duration-500 group-hover:opacity-100 landing-glow" />
      <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#0a0a0a]">
        <div className="absolute left-1/2 top-0 z-10 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-black" />
        <div className="min-h-[610px] bg-[radial-gradient(circle_at_top,#d6ff0033,transparent_34%),linear-gradient(180deg,#141414,#080808)] px-5 pb-6 pt-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#d6ff00]/45 bg-[#d6ff00]/12 shadow-[0_0_34px_rgba(214,255,0,0.16)]">
            <span className="text-xl font-bold text-[#d6ff00]">ll</span>
          </div>
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold text-white">@kullaniciadi</p>
            <p className="mt-1 text-sm text-white/62">Takipçini müşteriye çevir</p>
          </div>
          <div className="mt-7 space-y-3">
            {["Yeni koleksiyon", "WhatsApp ile teklif al", "Randevu oluştur", "Son video"].map((item, index) => (
              <motion.div
                key={item}
                className="grid min-h-14 grid-cols-[2rem_minmax(0,1fr)_1rem] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.075] px-4 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                animate={{ opacity: [0.78, 1, 0.78] }}
                transition={{ duration: 3.8, delay: index * 0.38, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d6ff00] text-black">
                  {index === 1 ? <MessageCircle className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                </span>
                <span className="truncate text-center">{item}</span>
                <ArrowRight className="h-4 w-4 text-[#d6ff00]" />
              </motion.div>
            ))}
          </div>
          <div className="mt-7 grid grid-cols-3 gap-2">
            {[["1.2K", "görüntü"], ["324", "tık"], ["7g", "trend"]].map(([value, label]) => (
              <div key={value} className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
                <p className="text-base font-bold text-white">{value}</p>
                <p className="text-[10px] text-white/45">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
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
        <section className="relative overflow-hidden border-b border-white/8 pb-16 pt-12 md:pb-24 md:pt-24">
          <div className="absolute inset-0 landing-surface" aria-hidden />
          <div className="container relative">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
              <Reveal direction="left">
                <div className="max-w-3xl">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    +150 kullanıcı • 250+ link • büyüyor
                  </div>
                  <h1 className="text-4xl font-bold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">Tüm linklerini tek sayfada topla</h1>
                  <p className="mt-4 text-2xl font-semibold text-primary sm:text-3xl">Takipçini müşteriye çevir</p>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-white/62 sm:text-lg">10 saniyede bio sayfanı oluştur. Daha fazla tıklama, daha fazla satış.</p>
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
                        <Button size="lg" className="h-14 w-full rounded-[14px] bg-primary px-7 font-bold text-primary-foreground shadow-[0_0_32px_rgba(214,255,0,0.24)] transition-transform active:scale-[0.98] sm:w-auto">
                          Ücretsiz Başla
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/55">
                    <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" />Ücretsiz</span><span>•</span><span>Kredi kartı gerekmez</span>
                  </div>
                </div>
              </Reveal>
              <BioPreview />
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container">
            <Reveal><div className="mb-10 max-w-2xl"><h2 className="text-3xl font-bold text-white md:text-4xl">3 adımda kullan</h2><p className="mt-3 text-sm text-white/58 md:text-base">Kullanıcıyı yormayan, hızlı ve net bir akış.</p></div></Reveal>
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <Reveal key={step} direction={index === 0 ? "left" : index === 1 ? "up" : "right"}>
                  <div className="premium-card group h-full rounded-[18px] border border-white/10 bg-[#111] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-black text-black">0{index + 1}</span>
                    <h3 className="mt-8 text-xl font-semibold text-white">{step}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">Tek ekranda ilerle, önizlemeyi anında gör, yayına al.</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/8 bg-[#0d0d0d] py-16 md:py-24"><div className="container"><Reveal direction="left"><h2 className="text-3xl font-bold text-white md:text-4xl">Neden llinktr</h2></Reveal><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{reasons.map((item) => (<Reveal key={item.title} direction="right"><div className="premium-card h-full rounded-[18px] border border-white/10 bg-[#151515] p-5 transition-all duration-300 hover:border-primary/35"><item.icon className="h-6 w-6 text-primary" /><h3 className="mt-5 text-base font-semibold text-white">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-white/55">{item.desc}</p></div></Reveal>))}</div></div></section>

        <section className="py-16 md:py-24"><div className="container"><div className="grid gap-4 md:grid-cols-3">{features.map((item) => (<Reveal key={item.title}><div className="premium-card rounded-[18px] border border-white/10 bg-[#111] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35"><item.icon className="h-7 w-7 text-primary" /><h3 className="mt-7 text-2xl font-bold text-white">{item.title}</h3><p className="mt-2 text-sm text-white/55">{item.desc}</p></div></Reveal>))}</div></div></section>

        <section className="border-y border-white/8 bg-[#0d0d0d] py-16 md:py-24"><div className="container"><Reveal direction="left"><h2 className="text-3xl font-bold text-white md:text-4xl">Hazır başlangıçlar</h2></Reveal><div className="mt-10 grid gap-4 md:grid-cols-3">{templates.map((template) => (<Reveal key={template.title} direction="right"><div className="template-card group min-h-64 overflow-hidden rounded-[18px] border border-white/10 bg-[#151515] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35"><div className="flex items-center justify-between"><span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{template.stat}</span><ArrowRight className="h-4 w-4 text-white/35 transition-transform group-hover:translate-x-1 group-hover:text-primary" /></div><h3 className="mt-20 text-2xl font-bold text-white">{template.title}</h3><p className="mt-3 text-sm leading-relaxed text-white/55">{template.desc}</p></div></Reveal>))}</div></div></section>

        <section className="py-16 md:py-24"><div className="container"><div className="grid gap-4 md:grid-cols-3">{testimonials.map((item) => (<Reveal key={item.name}><div className="premium-card h-full rounded-[18px] border border-white/10 bg-[#111] p-6"><p className="text-sm leading-relaxed text-white/68">&quot;{item.text}&quot;</p><div className="mt-6 border-t border-white/10 pt-4"><p className="font-semibold text-white">{item.name}</p><p className="text-xs text-white/45">{item.role}</p></div></div></Reveal>))}</div></div></section>

        <section className="pb-20 md:pb-28"><div className="container"><Reveal><div className="overflow-hidden rounded-[18px] border border-primary/20 bg-[#151515] px-6 py-10 text-center shadow-[0_0_60px_rgba(214,255,0,0.08)] md:px-10 md:py-14"><h2 className="text-3xl font-bold text-white md:text-5xl">Şimdi başla</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/58 md:text-base">Bio sayfanı kur, satış linklerini ekle, paylaşmaya başla.</p><Link href={targetHref}><Button size="lg" className="mt-8 h-13 rounded-[14px] bg-primary px-8 font-bold text-primary-foreground">Ücretsiz Başla<ArrowRight className="h-4 w-4" /></Button></Link></div></Reveal></div></section>
      </main>
      <Footer />
    </div>
  );
}
