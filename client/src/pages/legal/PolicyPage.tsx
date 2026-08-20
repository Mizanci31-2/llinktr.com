import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";

type PolicyKind = "community" | "help" | "report";

const content: Record<PolicyKind, { title: string; desc: string; sections: Array<[string, string]> }> = {
  community: {
    title: "Topluluk Kurallar1",
    desc: "Llinktr kullan1c1lar1 g�venli, yasal ve yan1lt1c1 olmayan balant1lar payla_makla y�k�ml�d�r.",
    sections: [
      ["Yasak i�erikler", "Yeti_kin i�erik, nefret s�ylemi, doland1r1c1l1k, zararl1 yaz1l1m, telif ihlali, yasa d1_1 �r�n ve hizmet balant1lar1 yasakt1r."],
      ["Spam ve yan1lt1c1 y�nlendirme", "Kullan1c1y1 ger�ek hedefinden farkl1 bir yere g�t�ren, �ok katmanl1 y�nlendirme yapan veya g�veni k�t�ye kullanan balant1lar kald1r1labilir."],
      ["0nceleme ve kald1rma", "Raporlanan i�erikler incelenebilir. Gerekli durumlarda sayfa yay1ndan kald1r1labilir veya hesap eri_imi s1n1rland1r1labilir."],
    ],
  },
  help: {
    title: "Yard1m Merkezi",
    desc: "Bio link sayfas1 olu_turma, link k1saltma, QR kod ve hesap ayarlar1 hakk1nda temel yard1m ba_l1klar1.",
    sections: [
      ["Bio sayfas1 olu_turma", "Panelden yeni sayfa olu_turabilir, linklerinizi ekleyebilir ve profilinizi public olarak payla_abilirsiniz."],
      ["Link ve QR ara�lar1", "K1sa link ve QR kod ara�lar1 ile balant1lar1n1z1 farkl1 kanallarda daha kolay payla_abilirsiniz."],
      ["Destek", "Teknik sorunlar ve g�venlik bildirimleri i�in ileti_im sayfas1ndan veya raporlama formundan bize ula_abilirsiniz."],
    ],
  },
  report: {
    title: "0�erik Raporla",
    desc: "Spam, zararl1 balant1, yeti_kin i�erik veya yan1lt1c1 profil bildirmek i�in bu sayfay1 kullanabilirsiniz.",
    sections: [
      ["Nas1l raporlan1r?", "^�pheli profil URL'sini, nedenini ve m�mk�nse ekran g�r�nt�s� bilgisini ileti_im formundan g�nderin."],
      ["0nceleme s�reci", "Raporlar k�t�ye kullan1m, g�venlik ve platform kurallar1 a�1s1ndan deerlendirilir."],
      ["Acil durumlar", "Zararl1 yaz1l1m veya kimlik av1 _�phesi varsa dorudan destek e-postas1na bildirim yap1n."],
    ],
  },
};

export default function PolicyPage({ kind }: { kind: PolicyKind }) {
  const page = content[kind];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="container max-w-4xl flex-1 py-12">
        <h1 className="text-4xl font-black md:text-5xl">{page.title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{page.desc}</p>
        <div className="mt-8 space-y-5">
          {page.sections.map(([title, body], index) => (
            <section key={title} className="rounded-2xl border border-white/10 bg-card p-6">
              <h2 className="text-xl font-black">{index + 1}. {title}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{body}</p>
            </section>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-primary/25 bg-primary/10 p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">Destek veya bildirim i�in ileti_im sayfas1n1 kullanabilirsiniz.</p>
          <Link href="/contact" className="mt-4 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-black text-black">0leti_ime ge�</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
