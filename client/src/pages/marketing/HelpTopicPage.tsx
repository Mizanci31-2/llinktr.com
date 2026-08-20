import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchHelpArticles, readAdminHelpArticles, type ManagedHelpArticle } from "@/lib/helpCenterAdminStore";
import { categories, defaultArticles, slugifyHelpValue } from "./HelpCenter";
import { ArrowLeft, BookOpen, HelpCircle, Search } from "lucide-react";

function useAllHelpArticles() {
  const [adminArticles, setAdminArticles] = useState<ManagedHelpArticle[]>(() => readAdminHelpArticles());

  useEffect(() => {
    void fetchHelpArticles().then(setAdminArticles).catch(() => setAdminArticles(readAdminHelpArticles()));
  }, []);

  return useMemo(() => [...adminArticles, ...defaultArticles], [adminArticles]);
}

function getHelpPathParts(path: string) {
  const clean = decodeURIComponent(path).replace(/^\/+|\/+$/g, "");
  const parts = clean.split("/");
  return {
    isCategory: parts[1] === "kategori",
    value: parts[2] || parts[1] || "",
  };
}

export default function HelpTopicPage() {
  const [location] = useLocation();
  const [query, setQuery] = useState("");
  const allArticles = useAllHelpArticles();
  const { isCategory, value } = getHelpPathParts(location);
  const category = isCategory ? categories.find((item) => slugifyHelpValue(item.title) === value) : null;
  const article = !isCategory ? allArticles.find((item) => item.id === value) : null;
  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

  const categoryArticles = useMemo(() => {
    const base = category ? allArticles.filter((item) => item.category === category.title) : [];
    if (!normalizedQuery) return base;
    return base.filter((item) =>
      `${item.title} ${item.summary} ${item.steps.join(" ")} ${item.tags.join(" ")}`
        .toLocaleLowerCase("tr-TR")
        .includes(normalizedQuery),
    );
  }, [allArticles, category, normalizedQuery]);

  const title = category?.title || article?.title || "Yard1m konusu bulunamad1";
  const description = category?.desc || article?.summary || "Arad11n1z yard1m konusu silinmi_ veya dei_tirilmi_ olabilir.";
  const Icon = category?.icon || BookOpen;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(214,255,0,0.18),transparent_34%),linear-gradient(180deg,#0d0f0b,#0a0a0a)]">
          <div className="container py-10 md:py-14">
            <Link href="/yardim-merkezi" className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-card px-4 py-2 text-sm font-black transition hover:border-primary/45">
              <ArrowLeft className="h-4 w-4" />
              Yard1m merkezine d�n
            </Link>
            <div className="max-w-4xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                <HelpCircle className="h-4 w-4" />
                Llinktr Yard1m Merkezi
              </div>
              <h1 className="text-4xl font-black leading-tight md:text-6xl">{title}</h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">{description}</p>
            </div>
          </div>
        </section>

        <section className="container py-10 md:py-14">
          {category ? (
            <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
              <aside className="rounded-[24px] border border-primary/25 bg-primary/10 p-5 lg:sticky lg:top-24 lg:self-start">
                <Icon className="h-7 w-7 text-primary" />
                <h2 className="mt-4 text-2xl font-black">{category.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{category.desc}</p>
                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/14 bg-card px-3 py-2">
                  <Search className="h-4 w-4 text-primary" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Bu konuda ara"
                    className="min-h-9 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground/65"
                  />
                </div>
              </aside>

              <div className="grid gap-4 md:grid-cols-2">
                {categoryArticles.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-border/70 bg-card p-6 text-sm text-muted-foreground md:col-span-2">
                    Bu kategoride arad11n1z sonu� bulunamad1.
                  </div>
                ) : (
                  categoryArticles.map((item) => (
                    <Link key={item.id} href={`/yardim-merkezi/${item.id}`} className="group rounded-[24px] border border-white/12 bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/10">
                      <span className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">{item.category}</span>
                      <h2 className="mt-3 text-xl font-black">{item.title}</h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
                      <span className="mt-5 inline-flex text-xs font-black text-primary group-hover:text-foreground">Konuyu a� �</span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          ) : article ? (
            <article className="mx-auto max-w-4xl rounded-[28px] border border-white/12 bg-card p-5 shadow-[0_24px_90px_rgba(0,0,0,0.28)] md:p-8">
              <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-black text-primary">{article.category}</span>
              <h2 className="mt-5 text-3xl font-black">{article.title}</h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{article.summary}</p>
              <div className="mt-5 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm leading-relaxed text-muted-foreground">
                Bu sayfada konuyla ilgili ��z�m� k1sa ve uygulanabilir ad1mlar halinde bulabilirsiniz. Ad1mlar1 s1rayla uygulay1n; i_lem tamamlanmazsa destek ekibine mesaj g�nderebilirsiniz.
              </div>
              <ol className="mt-8 grid gap-3">
                {article.steps.map((step, index) => (
                  <li key={`${step}-${index}`} className="flex gap-3 rounded-2xl border border-white/12 bg-background/45 p-4">
                    <b className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm text-black">{index + 1}</b>
                    <span className="pt-1 text-sm leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-8 rounded-2xl border border-primary/25 bg-primary/10 p-5">
                <h3 className="font-black">Sorun devam ediyor mu?</h3>
                <p className="mt-2 text-sm text-muted-foreground">Destek ekibine k1sa bir mesaj g�ndererek yard1m alabilirsiniz.</p>
                <Link href="/contact" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-black text-black">
                  0leti_ime ge�
                </Link>
              </div>
            </article>
          ) : (
            <div className="mx-auto max-w-3xl rounded-[28px] border border-white/12 bg-card p-8 text-center">
              <h2 className="text-3xl font-black">Yard1m konusu bulunamad1</h2>
              <p className="mt-3 text-muted-foreground">Bu rehber silinmi_ veya balant1s1 dei_mi_ olabilir.</p>
              <Link href="/yardim-merkezi" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-black text-black">
                Yard1m merkezine d�n
              </Link>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
