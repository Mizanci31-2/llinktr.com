import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MondiadNativeAd from "@/components/MondiadNativeAd";

const sections = [
  {
    title: "Hizmetin Kapsamı",
    text: "llinktr; bio link sayfası oluşturma, bağlantı yönetimi, kısa URL üretme, QR kod oluşturma ve temel profil düzenleme araçları sunar. Hizmet, kullanıcıların dijital bağlantılarını tek bir panelden yönetmesini kolaylaştırmak amacıyla sağlanır.",
  },
  {
    title: "Kullanıcı Sorumlulukları",
    text: "Kullanıcı, hesabında paylaştığı tüm metin, görsel, bağlantı, QR kod ve yönlendirmelerin doğruluğundan, güvenliğinden ve hukuka uygunluğundan sorumludur. Hesap bilgilerinin güncel tutulması kullanıcının sorumluluğundadır.",
  },
  {
    title: "Yasaklı Kullanımlar",
    text: "Telif hakkı ihlali, dolandırıcılık, zararlı yazılım bağlantıları, yasa dışı içerikler, yanıltıcı veya sahte yönlendirmeler ve başkalarının haklarını ihlal eden içerikler platformda kullanılamaz. Bu tür içerikler tespit edildiğinde erişim kısıtlanabilir veya kaldırılabilir.",
  },
  {
    title: "Kullanıcı İçerikleri",
    text: "Kullanıcı tarafından oluşturulan bio sayfaları, kısa linkler, QR kodlar ve diğer içerikler kullanıcıya aittir. llinktr, hizmetin işletilmesi için bu içerikleri teknik olarak saklayabilir ve yayınlayabilir.",
  },
  {
    title: "Hesap Güvenliği",
    text: "Şifre güvenliği, hesap erişimi ve hesabın yetkisiz kullanıma karşı korunması kullanıcının sorumluluğundadır. Şüpheli bir durum fark edilirse destek ekibiyle iletişime geçilmelidir.",
  },
  {
    title: "Hizmette Yapılabilecek Değişiklikler",
    text: "llinktr, hizmet özelliklerinde, arayüzde, teknik altyapıda veya kullanım şartlarında gerekli gördüğü güncellemeleri yapabilir. Güncel koşullar bu sayfada yayımlanır.",
  },
  {
    title: "Sorumluluk Sınırları",
    text: "llinktr, kullanıcı tarafından eklenen üçüncü taraf bağlantıların içeriğinden, erişilebilirliğinden veya doğurabileceği sonuçlardan sorumlu değildir. Hizmetin kesintisiz veya hatasız çalışacağı garanti edilmez.",
  },
  {
    title: "Hesap Silme ve Hizmet Sonlandırma",
    text: "Kullanıcı hesabının silinmesini talep edebilir. Kullanım şartlarına aykırı, güvenlik riski oluşturan veya yasal sorun doğuran hesaplar için hizmet erişimi sınırlandırılabilir.",
  },
  {
    title: "İletişim",
    text: "Kullanım şartları hakkında sorularınız veya destek talepleriniz için iletişim sayfamızdan bize ulaşabilirsiniz.",
  },
];

export default function Terms() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container max-w-4xl flex-1 py-12">
        <h1 className="mb-2 text-3xl font-bold md:text-5xl">Kullanım Şartları</h1>
        <p className="mb-8 text-sm text-muted-foreground">Son güncelleme: Nisan 2026</p>
        <div className="mb-8 rounded-2xl border border-border/50 bg-card p-6">
          <p className="leading-relaxed text-muted-foreground">
            Bu kullanım şartları, llinktr hizmetlerini kullanırken geçerli olan temel kuralları açıklar. Platformu kullanarak bu şartları okuduğunuzu ve kabul ettiğinizi beyan etmiş olursunuz.
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
      <MondiadNativeAd className="pb-10" />
      <Footer />
    </div>
  );
}
