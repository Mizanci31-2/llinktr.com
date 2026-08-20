import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 container py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Gizlilik Politikası</h1>
        <p className="text-muted-foreground mb-8">Son güncelleme: Nisan 2026</p>
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Toplanan Bilgiler</h2>
            <p>llinktr, hizmetlerimizi sağlamak amacıyla yalnızca gerekli bilgileri toplar. Bu bilgiler; hesap oluşturma sırasında sağladığınız ad ve e-posta adresi, oluşturduğunuz bio sayfaları ve içerikleri, kısalttığınız linkler ve oluşturduğunuz QR kodlara ilişkin verileri kapsar.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Bilgilerin Kullanımı</h2>
            <p>Topladığımız bilgileri; hizmetlerimizi sunmak ve geliştirmek, hesabınızı yönetmek, teknik destek sağlamak ve güvenliği korumak amacıyla kullanırız. Kişisel verilerinizi üçüncü taraflarla satmaz veya kiralamayız.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Veri Güvenliği</h2>
            <p>Verilerinizin güvenliğini sağlamak için endüstri standardı şifreleme ve güvenlik protokolleri kullanıyoruz. Tüm veriler güvenli sunucularda saklanmaktadır.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Çerezler</h2>
            <p>Oturum yönetimi ve kullanıcı deneyimini iyileştirmek için çerezler kullanıyoruz. Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz, ancak bu bazı özelliklerin çalışmamasına neden olabilir.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Haklarınız</h2>
            <p>KVKK kapsamında; verilerinize erişme, düzeltme, silme ve taşıma haklarına sahipsiniz. Bu haklarınızı kullanmak için bizimle iletişime geçebilirsiniz.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. İletişim</h2>
            <p>Gizlilik politikamız hakkında sorularınız için <a href="/contact" className="text-primary hover:underline">iletişim sayfamızı</a> ziyaret edebilirsiniz.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
