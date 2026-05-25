import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const sections = [
  {
    title: "Çerez Nedir?",
    text: "Çerezler, ziyaret ettiğiniz web siteleri tarafından tarayıcınıza kaydedilen küçük veri dosyalarıdır. Oturumun sürdürülmesi, güvenliğin sağlanması ve kullanıcı deneyiminin iyileştirilmesi için kullanılabilir.",
  },
  {
    title: "Hangi Çerezleri Kullanıyoruz?",
    text: "llinktr, temel hizmetlerin çalışması için zorunlu çerezler, performansın anlaşılması için analitik çerezler ve kullanıcı tercihlerini hatırlamak için tercih çerezleri kullanabilir.",
  },
  {
    title: "Zorunlu Çerezler",
    text: "Oturum açma, güvenlik, kimlik doğrulama ve panel işlevlerinin çalışması için gerekli çerezlerdir. Bu çerezler olmadan bazı özellikler düzgün çalışmayabilir.",
  },
  {
    title: "Performans ve Analitik Çerezleri",
    text: "Hizmetin nasıl kullanıldığını anlamak, hata ve performans sorunlarını tespit etmek ve deneyimi geliştirmek için sınırlı ölçüm verileri kullanılabilir.",
  },
  {
    title: "Tercih Çerezleri",
    text: "Tema, oturum veya arayüz tercihleri gibi ayarlarınızı hatırlamak için kullanılabilir. Bu sayede platformu tekrar ziyaret ettiğinizde daha tutarlı bir deneyim sunulur.",
  },
  {
    title: "Çerezleri Nasıl Yönetebilirsiniz?",
    text: "Tarayıcı ayarlarınız üzerinden çerezleri silebilir, engelleyebilir veya belirli siteler için izinleri değiştirebilirsiniz. Zorunlu çerezleri kapatmanız bazı hizmetlerin çalışmasını etkileyebilir.",
  },
  {
    title: "Üçüncü Taraf Çerezleri",
    text: "Platformda kullanılan bazı üçüncü taraf servisler kendi çerezlerini kullanabilir. Bu servislerin çerez uygulamaları kendi politikalarına tabidir.",
  },
  {
    title: "İletişim",
    text: "Çerez kullanımı hakkında sorularınız için iletişim sayfası üzerinden bize ulaşabilirsiniz.",
  },
];

export default function CookiePolicy() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container max-w-4xl flex-1 py-12">
        <h1 className="mb-2 text-3xl font-bold md:text-5xl">Çerez Politikası</h1>
        <p className="mb-8 text-sm text-muted-foreground">Son güncelleme: Nisan 2026</p>
        <div className="mb-8 rounded-2xl border border-border/50 bg-card p-6">
          <p className="leading-relaxed text-muted-foreground">
            Bu politika, llinktr üzerinde kullanılan çerez türlerini ve çerez tercihlerinizi nasıl yönetebileceğinizi açıklar. Çerezler yalnızca hizmetin çalışması ve deneyimin iyileştirilmesi için kullanılır.
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
