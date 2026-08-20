import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { fetchHelpArticles, HELP_ARTICLES_EVENT, readAdminHelpArticles, type ManagedHelpArticle } from "@/lib/helpCenterAdminStore";
import {
  HelpCircle,
  Link2,
  Lock,
  Mail,
  Palette,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react";

export function slugifyHelpValue(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/1/g, "i")
    .replace(//g, "g")
    .replace(/�/g, "u")
    .replace(/_/g, "s")
    .replace(/�/g, "o")
    .replace(/�/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const categories = [
  {
    title: "Ba_lang1�",
    desc: "Hesap a�ma, kullan1c1 ad1 ve ilk bio sayfas1.",
    icon: Sparkles,
    steps: ["�cretsiz hesap olu_tur", "Kullan1c1 ad1n1 se�", "0lk bio sayfan1 olu_tur", "Linklerini ekle", "Sayfan1 payla_"],
  },
  {
    title: "Hesap",
    desc: "Giri_, kay1t, _ifre ve hesap ayarlar1.",
    icon: UserRound,
    steps: ["Giri_ sayfas1na git", "E-posta ve _ifreni yaz", "Hesap ayarlar1ndan kullan1c1 ad1n1 d�zenle", "Gerekirse _ifre s1f1rlama balant1s1 iste"],
  },
  {
    title: "Link d�zenleme",
    desc: "Link ekleme, s1ralama, ikon ve g�r�n�rl�k.",
    icon: Link2,
    steps: ["Panelden linkler sekmesine gir", "Yeni link ekle", "Ba_l1k, URL ve ikon se�", "S1ralamay1 d�zenle", "Kaydet ve �nizle"],
  },
  {
    title: "Tema sistemi",
    desc: "Haz1r temalar, renkler, fontlar ve arka planlar.",
    icon: Palette,
    steps: ["Tasar1m b�l�m�n� a�", "Haz1r tema se�", "Vurgu ve yaz1 rengini kontrol et", "Telefon �nizlemesinde sonucu incele", "Kaydet"],
  },
  {
    title: "G�venlik",
    desc: "G�venli link, spam filtreleri ve hesap korumas1.",
    icon: Lock,
    steps: ["^�pheli linkleri kullanma", "Yan1lt1c1 ba_l1k ekleme", "Hesap _ifreni g��l� tut", "Raporlanan i�erikleri kontrol et"],
  },
  {
    title: "Sorun giderme",
    desc: "Y�kleme, kay1t, g�r�n�m ve balant1 sorunlar1.",
    icon: Wrench,
    steps: ["Sayfay1 yenile", "Taray1c1 �nbelleini temizle", "Link URL'sini kontrol et", "Sorun devam ederse ileti_im formundan yaz"],
  },
  {
    title: "Topluluk kurallar1",
    desc: "Yasak i�erikler, raporlama ve g�ven ilkeleri.",
    icon: ShieldCheck,
    steps: ["Yasak i�erik listesini incele", "Spam veya zararl1 balant1 payla_ma", "^�pheli profilleri raporla", "Platform g�venlik kurallar1na uy"],
  },
  {
    title: "QR kod kullan1m1",
    desc: "Bio sayfan i�in QR kod olu_turma ve payla_ma.",
    icon: QrCode,
    steps: ["QR Olu_turucu sayfas1na gir", "Bio linkini veya URL'ni yaz", "QR kodu olu_tur", "G�rseli indir", "Kartvizit, paket veya afi_lerde payla_"],
  },
];

export const defaultArticles: ManagedHelpArticle[] = [
  {
    id: "bio-sayfami-nasil-olustururum",
    title: "Bio sayfam1 nas1l olu_tururum?",
    category: "Ba_lang1�",
    summary: "Panelden Yeni Sayfa butonuna bas1n, kullan1c1 ad1n1z1 se�in ve linklerinizi ekleyin.",
    steps: ["Paneli a�1n", "Yeni Sayfa butonuna bas1n", "Kullan1c1 ad1n1z1 se�in", "0lk linklerinizi ekleyin", "Kaydedip �nizleyin"],
    tags: ["bio", "sayfa", "ba_lang1�"],
    source: "default",
  },
  {
    id: "linklerimi-nasil-siralarim",
    title: "Linklerimi nas1l s1ralar1m?",
    category: "Link d�zenleme",
    summary: "Link d�zenleme ekran1nda kartlar1 s�r�kleyerek veya yukar1/a_a1 kontrolleriyle s1ralayabilirsiniz.",
    steps: ["Bio d�zenleyiciyi a�1n", "Linkler b�l�m�ne gelin", "Kart1 s�r�kleyin veya oklar1 kullan1n", "Kaydet butonuna bas1n"],
    tags: ["link", "s1ralama", "drag"],
    source: "default",
  },
  {
    id: "qr-kod-nereden-alinir",
    title: "QR kod nereden al1n1r?",
    category: "QR kod kullan1m1",
    summary: "QR Olu_turucu sayfas1ndan bio linkiniz i�in h1zl1 QR kod olu_turabilirsiniz.",
    steps: ["QR Olu_turucu sayfas1na girin", "Bio linkinizi yaz1n", "QR kodu olu_turun", "G�rsel olarak indirin"],
    tags: ["qr", "kod", "indir"],
    source: "default",
  },
  {
    id: "tema-ve-vurgu-rengi",
    title: "Tema ve vurgu rengini nas1l dei_tiririm?",
    category: "Tema sistemi",
    summary: "Bio d�zenleme ekran1nda Tasar1m b�l�m�nden tema, vurgu rengi ve yaz1 rengini se�ebilirsiniz.",
    steps: ["Tasar1m b�l�m�n� a�1n", "Bir tema se�in", "Vurgu ve yaz1 rengini ayarlay1n", "Telefon �nizlemesini kontrol edin", "Kaydedin"],
    tags: ["tema", "renk", "tasar1m"],
    source: "default",
  },
  {
    id: "sifremi-unuttum",
    title: "^ifremi unuttum ne yapmal1y1m?",
    category: "Hesap",
    summary: "Giri_ sayfas1ndaki ^ifremi unuttum balant1s1yla e-posta adresinize s1f1rlama balant1s1 g�nderebilirsiniz.",
    steps: ["Giri_ sayfas1n1 a�1n", "^ifremi unuttum balant1s1na bas1n", "E-postan1z1 yaz1n", "Gelen balant1dan yeni _ifre belirleyin"],
    tags: ["_ifre", "hesap", "giri_"],
    source: "default",
  },
  {
    id: "supheli-profil-raporlama",
    title: "^�pheli bir profili nas1l raporlar1m?",
    category: "Topluluk kurallar1",
    summary: "Raporla sayfas1ndan profil balant1s1n1 ve sorunu a�1klayarak bildirim g�nderebilirsiniz.",
    steps: ["Raporla sayfas1n1 a�1n", "Profil balant1s1n1 ekleyin", "Sorunu k1sa a�1klay1n", "Formu g�nderin"],
    tags: ["rapor", "g�venlik", "profil"],
    source: "default",
  },
];

export default function HelpCenter() {
  const [query, setQuery] = useState("");
  const [adminArticles, setAdminArticles] = useState<ManagedHelpArticle[]>(() => readAdminHelpArticles());

  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
  const allArticles = useMemo(() => [...adminArticles, ...defaultArticles], [adminArticles]);
  const visibleArticles = useMemo(() => {
    if (!normalizedQuery) return allArticles;
    return allArticles.filter((article) =>
      `${article.title} ${article.summary} ${article.category} ${article.tags.join(" ")} ${article.steps.join(" ")}`
        .toLocaleLowerCase("tr-TR")
        .includes(normalizedQuery),
    );
  }, [allArticles, normalizedQuery]);

  useEffect(() => {
    const refresh = () => setAdminArticles(readAdminHelpArticles());
    void fetchHelpArticles().then(setAdminArticles).catch(() => refresh());
    window.addEventListener(HELP_ARTICLES_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(HELP_ARTICLES_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(214,255,0,0.22),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(45,212,191,0.12),transparent_30%),linear-gradient(180deg,#0d0f0b,#0a0a0a)]">
          <div className="container py-14 md:py-20">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                <HelpCircle className="h-4 w-4" />
                Llinktr Yard1m Merkezi
              </div>
              <h1 className="text-4xl font-black leading-tight md:text-6xl">Arad11n1z cevab1 h1zl1ca bulun</h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Bio link sayfas1 olu_turma, link d�zenleme, tema sistemi, QR kod ve g�venlik i�in sade rehberler.
              </p>
              <div className="mx-auto mt-8 flex max-w-2xl items-center gap-3 rounded-[22px] border border-white/14 bg-card/92 px-4 py-3 shadow-[0_22px_70px_rgba(0,0,0,0.25)]">
                <Search className="h-5 w-5 shrink-0 text-primary" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Konu, �zellik veya sorun ara"
                  className="min-h-11 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground/65"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="container py-10 md:py-14">
          <div className="mx-auto max-w-5xl">
            <div className="mb-5">
              <h2 className="text-2xl font-black">{normalizedQuery ? "Arama sonu�lar1" : "Yard1m konular1"}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                0htiyac1n1z olan konuyu se�in. Her kart kendi detay sayfas1nda k1sa a�1klama, ��z�m ve ad1m ad1m rehber olarak a�1l1r.
              </p>
            </div>

            {visibleArticles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-card p-6 text-sm text-muted-foreground">
                Arad11n1z konuyla ilgili sonu� bulunamad1, bize ula_abilirsiniz.
              </div>
            ) : (
              <div className="space-y-3">
                {visibleArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/yardim-merkezi/${article.id}`}
                    className="group block rounded-2xl border border-white/12 bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/10"
                  >
                    <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-primary">{article.category}</span>
                    <span className="block text-xl font-black">{article.title}</span>
                    <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">{article.summary}</span>
                    <span className="mt-4 inline-flex text-xs font-black text-primary group-hover:text-foreground">Detay sayfas1n1 a� �</span>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-6 rounded-[24px] border border-white/12 bg-card p-5">
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="mt-4 text-xl font-black">Sorun ��z�lmedi mi?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Destek ekibine mesaj g�nderebilir veya _�pheli i�erik i�in rapor olu_turabilirsiniz.</p>
              <div className="mt-5 grid gap-2">
                <Link href="/contact" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-black text-black">0leti_ime ge�</Link>
                <Link href="/report" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-bold">Rapor olu_tur</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
