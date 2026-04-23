import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Zap, Link2, QrCode, Palette } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 container py-12 max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">llinktr Hakkında</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Dijital varlığınızı tek bir noktadan yönetmenizi sağlayan modern bir link yönetim platformu.
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border/50">
            <h2 className="text-xl font-semibold mb-3">Misyonumuz</h2>
            <p className="text-muted-foreground leading-relaxed">
              llinktr, içerik üreticilerinin, girişimcilerin ve markaların dijital varlıklarını en etkili şekilde yönetmelerine yardımcı olmak için tasarlandı. Bio link, link kısaltma ve QR kod araçlarını tek bir platformda bir araya getirerek dijital pazarlama süreçlerinizi basitleştiriyoruz.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Zap, title: "Bio Link Düzenleyici", desc: "Özelleştirilebilir bio sayfaları", color: "text-primary", bg: "bg-primary/10" },
              { icon: Link2, title: "Link Kısaltıcı", desc: "Akılda kalıcı kısa linkler", color: "text-blue-400", bg: "bg-blue-400/10" },
              { icon: QrCode, title: "QR Oluşturucu", desc: "Yüksek kaliteli QR kodlar", color: "text-purple-400", bg: "bg-purple-400/10" },
              { icon: Palette, title: "Özel Temalar", desc: "10 hazır tema seçeneği", color: "text-pink-400", bg: "bg-pink-400/10" },
            ].map((item, i) => (
              <div key={i} className="p-5 rounded-xl bg-card border border-border/50">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${item.bg} mb-3`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <p className="font-semibold text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/50">
            <h2 className="text-xl font-semibold mb-3">Neden llinktr?</h2>
            <ul className="space-y-2 text-muted-foreground">
              {[
                "Tamamen ücretsiz temel özellikler",
                "Kolay kullanım, teknik bilgi gerektirmez",
                "Anlık canlı önizleme ile tasarım",
                "15 sosyal medya platformu desteği",
                "10 hazır tema ve özel renk seçimi",
                "Mobil uyumlu, hızlı yüklenen sayfalar",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
