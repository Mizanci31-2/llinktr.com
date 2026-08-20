import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const sections = [
  {
    title: "�erez Nedir?",
    text: "�erezler, ziyaret ettiiniz web siteleri taraf1ndan taray1c1n1za kaydedilen k���k veri dosyalar1d1r. Oturumun s�rd�r�lmesi, g�venliin salanmas1 ve kullan1c1 deneyiminin iyile_tirilmesi i�in kullan1labilir.",
  },
  {
    title: "Hangi �erezleri Kullan1yoruz?",
    text: "llinktr, temel hizmetlerin �al1_mas1 i�in zorunlu �erezler, performans1n anla_1lmas1 i�in analitik �erezler ve kullan1c1 tercihlerini hat1rlamak i�in tercih �erezleri kullanabilir.",
  },
  {
    title: "Zorunlu �erezler",
    text: "Oturum a�ma, g�venlik, kimlik dorulama ve panel i_levlerinin �al1_mas1 i�in gerekli �erezlerdir. Bu �erezler olmadan baz1 �zellikler d�zg�n �al1_mayabilir.",
  },
  {
    title: "Performans ve Analitik �erezleri",
    text: "Hizmetin nas1l kullan1ld11n1 anlamak, hata ve performans sorunlar1n1 tespit etmek ve deneyimi geli_tirmek i�in s1n1rl1 �l��m verileri kullan1labilir.",
  },
  {
    title: "Tercih �erezleri",
    text: "Tema, oturum veya aray�z tercihleri gibi ayarlar1n1z1 hat1rlamak i�in kullan1labilir. Bu sayede platformu tekrar ziyaret ettiinizde daha tutarl1 bir deneyim sunulur.",
  },
  {
    title: "�erezleri Nas1l Y�netebilirsiniz?",
    text: "Taray1c1 ayarlar1n1z �zerinden �erezleri silebilir, engelleyebilir veya belirli siteler i�in izinleri dei_tirebilirsiniz. Zorunlu �erezleri kapatman1z baz1 hizmetlerin �al1_mas1n1 etkileyebilir.",
  },
  {
    title: "���nc� Taraf �erezleri",
    text: "Platformda kullan1lan baz1 ���nc� taraf servisler kendi �erezlerini kullanabilir. Bu servislerin �erez uygulamalar1 kendi politikalar1na tabidir.",
  },
  {
    title: "0leti_im",
    text: "�erez kullan1m1 hakk1nda sorular1n1z i�in ileti_im sayfas1 �zerinden bize ula_abilirsiniz.",
  },
];

export default function CookiePolicy() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container max-w-4xl flex-1 py-12">
        <h1 className="mb-2 text-3xl font-bold md:text-5xl">�erez Politikas1</h1>
        <p className="mb-8 text-sm text-muted-foreground">Son g�ncelleme: Nisan 2026</p>
        <div className="mb-8 rounded-2xl border border-border/50 bg-card p-6">
          <p className="leading-relaxed text-muted-foreground">
            Bu politika, llinktr �zerinde kullan1lan �erez t�rlerini ve �erez tercihlerinizi nas1l y�netebileceinizi a�1klar. �erezler yaln1zca hizmetin �al1_mas1 ve deneyimin iyile_tirilmesi i�in kullan1l1r.
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
        <p className="mt-8 text-xs text-muted-foreground">Bu �cretsiz ara� Silah_�r A1 taraf1ndan sunulmaktad1r.</p>
      </main>
      <Footer />
    </div>
  );
}
