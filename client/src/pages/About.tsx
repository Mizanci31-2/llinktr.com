import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link2, Palette, QrCode, Zap } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="container max-w-3xl flex-1 py-12">
        <div className="mb-12 text-center">
          <img src="/site-logo.png" alt="llinktr" className="mx-auto mb-5 h-16 w-auto max-w-[260px] object-contain" />
          <h1 className="mb-3 text-3xl font-bold">llinktr Hakkinda</h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Dijital varliginizi tek bir panelde yonetmenizi saglayan modern bio link platformu.
          </p>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border/50 bg-card p-6">
            <h2 className="mb-3 text-xl font-semibold">Misyonumuz</h2>
            <p className="leading-relaxed text-muted-foreground">
              llinktr ile bio link, link kisaltma ve QR kod hizmetlerini tek bir yerden yonetebilir,
              profilinizi hizli sekilde yayina alabilirsiniz.
            </p>
          </section>

          <section className="grid grid-cols-2 gap-4">
            {[
              { icon: Zap, title: "Bio Link", desc: "Profilinize ozel bio sayfasi", color: "text-primary", bg: "bg-primary/10" },
              { icon: Link2, title: "Link Kisaltici", desc: "Uzun URLleri hizla kisaltin", color: "text-blue-400", bg: "bg-blue-400/10" },
              { icon: QrCode, title: "QR Olusturucu", desc: "Linkler icin anlik QR kod", color: "text-violet-400", bg: "bg-violet-400/10" },
              { icon: Palette, title: "Tema Kutuphanesi", desc: "bir cok hazir tema secenegi", color: "text-pink-400", bg: "bg-pink-400/10" },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-border/50 bg-card p-5">
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${item.bg}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-border/50 bg-card p-6">
            <h2 className="mb-3 text-xl font-semibold">Neden llinktr?</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "Tamamen ucretsiz hizmet",
                "Kolay kullanim, teknik bilgi gerektirmez",
                "Anlik canli onizleme ile hizli duzenleme",
                "bir cok hazir sosyal medya platformu destegi",
                "bir cok hazir tema ve ozel renk secimi",
                "Mobil uyumlu hizli sayfalar",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
