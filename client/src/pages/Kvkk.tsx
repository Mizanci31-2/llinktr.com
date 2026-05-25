import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MondiadNativeAd from "@/components/MondiadNativeAd";

const sections = [
  {
    title: "Veri Sorumlusu",
    text: "llinktr, sunduğu dijital araçlar kapsamında kişisel verilerinizi 6698 sayılı Kişisel Verilerin Korunması Kanunu ve ilgili mevzuata uygun şekilde işlemeye özen gösterir.",
  },
  {
    title: "İşlenen Kişisel Veriler",
    text: "Kullanıcı adı, e-posta adresi, hesap bilgileri, bio sayfası içerikleri, bağlantılar, QR kod verileri, işlem kayıtları ve destek taleplerinde paylaştığınız bilgiler işlenebilir.",
  },
  {
    title: "Kişisel Verilerin İşlenme Amaçları",
    text: "Verileriniz; hesap oluşturma, oturum yönetimi, hizmetlerin sunulması, güvenliğin sağlanması, destek taleplerinin yanıtlanması, teknik sorunların giderilmesi ve kullanıcı deneyiminin iyileştirilmesi amaçlarıyla işlenir.",
  },
  {
    title: "Hukuki Sebepler",
    text: "Kişisel verileriniz; sözleşmenin kurulması veya ifası, hukuki yükümlülüklerin yerine getirilmesi, meşru menfaatler ve açık rızanızın gerektiği durumlarda rızanıza dayanılarak işlenebilir.",
  },
  {
    title: "Verilerin Aktarılması",
    text: "Kişisel verileriniz hizmetin sunulması için gerekli teknik altyapı sağlayıcılarıyla sınırlı olarak paylaşılabilir. Verileriniz üçüncü taraflara satılmaz.",
  },
  {
    title: "Saklama Süresi",
    text: "Verileriniz, işleme amaçlarının gerektirdiği süre boyunca ve ilgili mevzuatta öngörülen saklama süreleri kadar muhafaza edilir. Süre sonunda veriler silinir, yok edilir veya anonim hale getirilir.",
  },
  {
    title: "KVKK Kapsamındaki Haklarınız",
    text: "KVKK kapsamında verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltme, silme, itiraz etme ve mevzuatta belirtilen diğer haklara sahipsiniz.",
  },
  {
    title: "Başvuru ve İletişim",
    text: "KVKK kapsamındaki talepleriniz için iletişim sayfasındaki kanallardan bize ulaşabilirsiniz. Başvurularınız mevzuata uygun şekilde değerlendirilir.",
  },
];

export default function Kvkk() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container max-w-4xl flex-1 py-12">
        <h1 className="mb-2 text-3xl font-bold md:text-5xl">KVKK Aydınlatma Metni</h1>
        <p className="mb-8 text-sm text-muted-foreground">Son güncelleme: Nisan 2026</p>
        <div className="mb-8 rounded-2xl border border-border/50 bg-card p-6">
          <p className="leading-relaxed text-muted-foreground">
            Bu aydınlatma metni, llinktr tarafından işlenen kişisel verileriniz hakkında sizi bilgilendirmek amacıyla hazırlanmıştır. Verileriniz yalnızca gerekli olduğu ölçüde ve güvenli şekilde işlenir.
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
