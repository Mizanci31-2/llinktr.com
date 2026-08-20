import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Kullanım Şartları</h1>
        <p className="text-muted-foreground mb-8">Son güncelleme: Nisan 2026</p>

        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Hizmetin Kullanımı</h2>
            <p>llinktr; bio link sayfası oluşturma, link kısaltma, QR kod üretme ve bağlantı analizlerini takip etme araçları sunar. Hizmeti kullanırken yürürlükteki mevzuata ve üçüncü taraf haklarına uygun davranmanız gerekir.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Kullanıcı İçeriği</h2>
            <p>Bio sayfalarınıza eklediğiniz metin, görsel ve linklerden siz sorumlusunuz. Telif hakkı ihlali, yanıltıcı içerik, zararlı bağlantılar veya hukuka aykırı içerikler platformdan kaldırılabilir.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Hesap Güvenliği</h2>
            <p>Hesabınızın güvenliğini korumak sizin sorumluluğunuzdadır. Şüpheli bir kullanım fark ederseniz destek ekibiyle iletişime geçebilirsiniz.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Değişiklikler</h2>
            <p>llinktr, hizmet özelliklerini ve bu şartları gerektiğinde güncelleyebilir. Güncel şartlar bu sayfada yayınlanır.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
