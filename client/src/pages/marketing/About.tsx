import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, BarChart3, Link2, Palette, QrCode, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Link } from "wouter";

const features = [
  { icon: Zap, title: "Bio Link", desc: "T�m �nemli balant1lar1n1z1 tek, h1zl1 ve mobil uyumlu sayfada toplay1n." },
  { icon: Link2, title: "Link K1salt1c1", desc: "Uzun URL'leri payla_mas1 kolay, temiz ve �l��lebilir balant1lara �evirin." },
  { icon: QrCode, title: "QR Olu_turucu", desc: "Kampanya, maaza ve sosyal profilleriniz i�in saniyeler i�inde QR kod �retin." },
  { icon: Palette, title: "Tema K�t�phanesi", desc: "Markan1za uygun haz1r temalar, vurgu renkleri ve canl1 �nizleme ile d�zenleyin." },
];

const reasons = [
  "Teknik bilgi gerektirmeyen sade d�zenleme paneli",
  "Canl1 �nizleme ile neyi dei_tirdiinizi an1nda g�rme",
  "Mobil �ncelikli, h1zl1 a�1lan public sayfalar",
  "Link performans1n1 takip edebileceiniz analiz alanlar1",
  "Sat1_, i�erik �retimi ve portfolyo kullan1mlar1 i�in esnek blok sistemi",
  "Kredi kart1 gerektirmeden h1zl1 ba_lang1�",
];

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="overflow-hidden">
        <section className="relative border-b border-[#d6ff00]/18 bg-[radial-gradient(circle_at_18%_8%,rgba(214,255,0,0.26),transparent_34%),radial-gradient(circle_at_76%_22%,rgba(214,255,0,0.10),transparent_28%),linear-gradient(180deg,#050505,#0A0A0A)]">
          <div className="container grid gap-8 py-14 md:grid-cols-[1fr_0.75fr] md:items-center md:py-20">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d6ff00]/55 bg-[#d6ff00]/12 px-3 py-1 text-xs font-bold text-[#d6ff00] shadow-[0_0_22px_rgba(214,255,0,0.16)]">
                <Sparkles className="h-3.5 w-3.5" />
                llinktr hakk1nda
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                Linklerinizi, sat1_ ak1_lar1n1z1 ve sosyal profillerinizi tek merkezden y�netin.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                llinktr; i�erik �reticileri, k���k i_letmeler ve freelancerlar i�in tasarlanm1_ modern bir bio link platformudur. Ama� basit:
                daha h1zl1 kurulum, daha temiz g�r�n�m ve daha �l��lebilir balant1lar.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/kayit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-black shadow-[0_0_22px_rgba(214,255,0,0.28)] transition hover:-translate-y-0.5 hover:brightness-110">
                  �cretsiz Ba_la
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/dashboard" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border/70 bg-card/70 px-5 text-sm font-bold transition hover:border-primary/50">
                  Bio Link Olu_tur
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-[#d6ff00]/25 bg-[linear-gradient(145deg,rgba(214,255,0,0.08),rgba(17,17,17,0.86)_38%,rgba(8,8,8,0.96))] p-5 shadow-[0_28px_90px_rgba(214,255,0,0.10),0_28px_80px_rgba(0,0,0,0.35)]">
              <div className="mb-6 inline-flex rounded-2xl border border-[#d6ff00]/20 bg-black/45 px-4 py-3 shadow-[0_0_28px_rgba(214,255,0,0.10)]">
                <img src="/site-logo.png" alt="llinktr" className="h-14 w-auto max-w-[240px] object-contain" />
              </div>
              <div className="grid gap-3">
                {[
                  { label: "Kurulum", value: "10 sn" },
                  { label: "Y�netim", value: "Tek panel" },
                  { label: "Deneyim", value: "Mobil haz1r" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl border border-[#d6ff00]/16 bg-black/35 px-4 py-3">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-black text-[#d6ff00]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container py-12 md:py-16">
          <div className="mb-7 max-w-2xl">
            <h2 className="text-2xl font-black md:text-3xl">Misyonumuz</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              Dijital varl11n1 b�y�tmek isteyen herkesin dakikalar i�inde profesyonel bir balant1 sayfas1 olu_turmas1n1 salamak.
              llinktr; sade aray�z, h1zl1 performans ve �l��lebilir sonu�lar �zerine kuruldu.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {features.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_rgba(0,0,0,0.20)]">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-black">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border/50 bg-card/30">
          <div className="container grid gap-5 py-12 md:grid-cols-[0.8fr_1fr] md:items-start md:py-16">
            <div>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-black md:text-3xl">Neden llinktr?</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                llinktr, karma_1k ara�lar1 tek bir sade panelde toplar. Kullan1c1 d�_�nmeden sayfas1n1 kurar, payla_1r ve performans1n1 izler.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {reasons.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-border/60 bg-background/70 p-4">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_14px_rgba(214,255,0,0.45)]" />
                  <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-12 md:py-16">
          <div className="rounded-3xl border border-primary/20 bg-[radial-gradient(circle_at_10%_0%,rgba(214,255,0,0.18),transparent_30%),linear-gradient(135deg,rgba(21,21,21,0.96),rgba(8,8,8,0.96))] p-6 md:p-8">
            <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Daha temiz, daha h1zl1, daha �l��lebilir
                </div>
                <h2 className="text-2xl font-black md:text-3xl">Bio sayfan1z1 bug�n yay1na al1n.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Linklerinizi, konumlar1n1z1, sosyal hesaplar1n1z1 ve sat1_ ak1_lar1n1z1 tek sayfada birle_tirin.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                <Link href="/kayit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-black transition hover:brightness-110">
                  �cretsiz Ba_la
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border/70 bg-black/20 px-5 text-sm font-bold transition hover:border-primary/50">
                  Bio Link Olu_tur
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
