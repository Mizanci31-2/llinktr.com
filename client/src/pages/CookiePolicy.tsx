import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Çerez Politikası</h1>
        <p className="text-muted-foreground mb-8">Son güncelleme: Nisan 2026</p>

        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Çerez Nedir?</h2>
            <p>Çerezler, web sitesinin cihazınızda sakladığı küçük veri dosyalarıdır. Oturumunuzu hatırlamak, güvenliği sağlamak ve deneyimi iyileştirmek için kullanılabilir.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Kullanılan Çerezler</h2>
            <p>llinktr, oturum yönetimi ve temel uygulama işlevleri için zorunlu çerezler kullanır. Analitik çerezler yalnızca ilgili yapılandırmalar etkinleştirildiğinde devreye alınır.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Çerezleri Yönetme</h2>
            <p>Tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz. Zorunlu çerezleri kapatmanız bazı özelliklerin çalışmamasına neden olabilir.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
