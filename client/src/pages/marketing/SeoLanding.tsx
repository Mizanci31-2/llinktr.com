import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { buildLandingParagraphs, landingPages, type LandingKind } from "@/lib/marketingContent";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
;

export default function SeoLanding({ kind }: { kind: LandingKind }) {
  const page = landingPages[kind];
  const paragraphs = buildLandingParagraphs(page.keyword);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(214,255,0,0.18),transparent_32%),linear-gradient(180deg,#050505,#0A0A0A)]">
          <div className="container grid gap-8 py-14 md:grid-cols-[1fr_360px] md:items-center md:py-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{page.keyword}</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">{page.h1}</h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">{page.description}</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/kayit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-black">
                  �cretsiz Ba_la
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/blog" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-bold">
                  Rehberleri Oku
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-primary/20 bg-card p-6">
              {["�cretsiz bio link sayfas1", "Mobil uyumlu tasar1m", "SEO dostu yap1", "Spam ve k�t�ye kullan1m politikas1"].map((item) => (
                <div key={item} className="flex items-center gap-3 border-b border-white/10 py-4 last:border-b-0">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-bold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container max-w-5xl py-12 md:py-16">
          <div className="space-y-6">
            {paragraphs.map((paragraph, index) => (
              <section key={index} className="rounded-2xl border border-white/10 bg-card p-6">
                <h2 className="mb-3 text-xl font-black">{index + 1}. {index === 0 ? page.keyword : "Bio link sayfas1 kullan1m1"}</h2>
                <p className="text-base leading-8 text-muted-foreground">{paragraph}</p>
              </section>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
