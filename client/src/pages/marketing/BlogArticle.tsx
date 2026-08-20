import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BLOG_POSTS_EVENT, getAllBlogPosts } from "@/lib/blogAdminStore";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
;
import NotFound from "@/pages/system/NotFound";

export default function BlogArticle() {
  const params = useParams();
  const match = true; // migrated route match
  const [posts, setPosts] = useState(() => getAllBlogPosts());
  const post = posts.find((item) => item.slug === params?.slug);

  useEffect(() => {
    const refresh = () => setPosts(getAllBlogPosts());
    window.addEventListener(BLOG_POSTS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(BLOG_POSTS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!post) return <NotFound />;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <article>
          <header className="border-b border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(214,255,0,0.16),transparent_32%),linear-gradient(180deg,#050505,#0A0A0A)]">
            <div className="container max-w-4xl py-12 md:py-18">
              <Link href="/blog" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
                <ArrowLeft className="h-4 w-4" />
                Bloga d�n
              </Link>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Llinktr Rehber</p>
              <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">{post.title}</h1>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{post.description}</p>
            </div>
          </header>

          <div className="container max-w-4xl py-10 md:py-14">
            <p className="rounded-2xl border border-white/10 bg-card p-6 text-base leading-relaxed text-muted-foreground">{post.intro}</p>
            <div className="mt-8 space-y-6">
              {post.sections.map(([title, body], index) => (
                <section key={title} className="rounded-2xl border border-white/10 bg-card p-6">
                  <h2 className="text-2xl font-black">{index + 1}. {title}</h2>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">{body}</p>
                </section>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-primary/25 bg-primary/10 p-6">
              <h2 className="text-2xl font-black">Kendi bio link sayfan1z1 olu_turun</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Llinktr ile balant1lar1n1z1 tek sayfada toplayabilir, QR kod ve k1sa link ara�lar1yla payla_1m ak1_1n1z1 sadele_tirebilirsiniz.
              </p>
              <Link href="/kayit" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-black">
                �cretsiz Ba_la
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
