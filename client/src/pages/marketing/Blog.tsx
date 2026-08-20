import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BLOG_POSTS_EVENT, getAllBlogPosts } from "@/lib/blogAdminStore";
import { ArrowRight, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
;

export default function Blog() {
  const [posts, setPosts] = useState(() => getAllBlogPosts());

  useEffect(() => {
    const refresh = () => setPosts(getAllBlogPosts());
    window.addEventListener(BLOG_POSTS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(BLOG_POSTS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(214,255,0,0.18),transparent_32%),linear-gradient(180deg,#050505,#0A0A0A)]">
          <div className="container py-14 md:py-20">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <BookOpen className="h-4 w-4" />
              Llinktr Blog
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-6xl">Bio link, sosyal medya ve link yönetimi rehberleri</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              İçerik üreticileri, markalar ve e-ticaret satıcıları için pratik, temiz ve SEO uyumlu bio link rehberleri.
            </p>
          </div>
        </section>

        <section className="container py-12 md:py-16">
          <div className="grid gap-4 md:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-2xl border border-white/10 bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.04]"
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Rehber</p>
                <h2 className="mt-3 text-2xl font-black text-white">{post.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{post.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">
                  Yazıyı oku
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
