import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const sections = [
  {
    title: "Toplanan Bilgiler",
    text: "llinktr, hizmeti sunmak için gerekli olan sınırlı bilgileri işler. Bu bilgiler; kullanıcı adı, e-posta adresi, hesap ayarları, bio sayfası içerikleri, kısa bağlantılar, QR kod verileri ve temel kullanım kayıtlarını içerebilir.",
  },
  {
    title: "Bilgilerin Kullanım Amaçları",
    text: "Bilgileriniz hesap oluşturma, oturum yönetimi, bio sayfası yayınlama, kısa link ve QR kod hizmetlerini çalıştırma, güvenliği sağlama, destek taleplerini yanıtlama ve hizmet kalitesini iyileştirme amaçlarıyla kullanılır.",
  },
  {
    title: "Hesap ve Profil Bilgileri",
    text: "Profil adı, açıklama, görseller ve hesabınıza bağlı ayarlar sizin tarafınızdan yönetilir. Bu bilgiler bio sayfanız yayındaysa ziyaretçiler tarafından görüntülenebilir.",
  },
  {
    title: "Link, QR Kod ve Kısa URL Verileri",
    text: "Eklediğiniz bağlantılar, oluşturduğunuz kısa URL'ler ve QR kodlar hizmetin çalışması için saklanır. Kullanıcı, kendi eklediği bağlantı ve içeriklerin doğruluğundan ve hukuka uygunluğundan sorumludur.",
  },
  {
    title: "Çerezler ve Analitik",
    text: "Oturumun güvenli şekilde yürütülmesi, tercihlerin hatırlanması ve hizmet performansının anlaşılması için çerezler kullanılabilir. Çerez ayarlarınızı tarayıcınız üzerinden yönetebilirsiniz.",
  },
  {
    title: "Verilerin Güvenliği",
    text: "Kişisel verilerin güvenliği için makul teknik ve idari önlemler uygulanır. Ancak internet üzerinden veri aktarımının tamamen risksiz olmadığı unutulmamalıdır.",
  },
  {
    title: "Üçüncü Taraf Bağlantılar",
    text: "Bio sayfalarınızda veya kısa linklerinizde üçüncü taraf sitelere yönlendirme bulunabilir. Bu sitelerin gizlilik uygulamalarından llinktr sorumlu değildir.",
  },
  {
    title: "Kullanıcı Hakları",
    text: "Kullanıcılar kişisel verilerine erişme, düzeltme, silme, işlemeye itiraz etme ve mevzuat kapsamındaki diğer haklarını kullanma talebinde bulunabilir.",
  },
  {
    title: "Veri Saklama Süresi",
    text: "Veriler, hizmetin sağlanması için gerekli süre boyunca ve yasal yükümlülüklerin gerektirdiği ölçüde saklanır. Hesap silme taleplerinde ilgili veriler süreç tamamlandıktan sonra uygun şekilde işleme alınır.",
  },
  {
    title: "İletişim",
    text: "Gizlilik politikası veya kişisel verilerinizle ilgili sorularınız için iletişim sayfası üzerinden bizimle bağlantıya geçebilirsiniz.",
  },
];

export default function Privacy() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container max-w-4xl flex-1 py-12">
        <h1 className="mb-2 text-3xl font-bold md:text-5xl">Gizlilik Politikası</h1>
        <p className="mb-8 text-sm text-muted-foreground">Son güncelleme: Nisan 2026</p>
        <div className="mb-8 rounded-2xl border border-border/50 bg-card p-6 text-muted-foreground">
          <p className="leading-relaxed">
            llinktr, kullanıcılarının gizliliğine önem verir ve yalnızca hizmeti sunmak için gerekli bilgileri işler. Kişisel veriler üçüncü taraflara satılmaz. Kullanıcılar, platforma ekledikleri içeriklerden ve bağlantılardan kendileri sorumludur.
          </p>
        </div>
        <div className="space-y-5">
          {sections.map((section, index) => (
            <section key={section.title} className="rounded-2xl border border-border/50 bg-card p-6">
              <h2 className="mb-3 text-xl font-semibold">{index + 1}. {section.title}</h2>
              <p className="leading-relaxed text-muted-foreground">{section.text}</p>
            </section>
          ))}
        </div>
        <p className="mt-8 text-xs text-muted-foreground">Bu ücretsiz araç Silahşör Ağı tarafından sunulmaktadır.</p>
      </main>
      <Footer />
    </div>
  );
}
