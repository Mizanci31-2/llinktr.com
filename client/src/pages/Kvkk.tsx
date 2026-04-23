import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Kvkk() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">KVKK Aydınlatma Metni</h1>
        <p className="text-muted-foreground mb-8">Son güncelleme: Nisan 2026</p>

        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Veri Sorumlusu</h2>
            <p>llinktr, hizmetlerin sunulması kapsamında kişisel verilerinizi KVKK ve ilgili mevzuata uygun şekilde işler.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. İşlenen Veriler</h2>
            <p>Hesap bilgileriniz, bio sayfası içerikleriniz, kısaltılmış bağlantılarınız ve kullanım istatistikleriniz hizmetin çalışması için işlenebilir.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. İşleme Amaçları</h2>
            <p>Verileriniz hesap yönetimi, güvenlik, hizmet sunumu, teknik destek ve uygulama deneyimini iyileştirme amaçlarıyla kullanılır.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Haklarınız</h2>
            <p>KVKK kapsamındaki erişim, düzeltme, silme, itiraz ve bilgi talebi haklarınızı iletişim sayfası üzerinden bize ulaşarak kullanabilirsiniz.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
