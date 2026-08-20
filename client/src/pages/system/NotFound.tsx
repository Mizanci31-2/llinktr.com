import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Home, Search, UserPlus } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";

export default function NotFound() {
  useEffect(() => {
    document.title = "Sayfa bulunamadı | Llinktr";
    let robots = document.querySelector("meta[name='robots']") as HTMLMetaElement | null;
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    robots.content = "noindex,follow";
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-16 text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[12%] top-[18%] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[10%] top-[8%] h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
        <section className="relative w-full overflow-hidden rounded-[2rem] border border-white/12 bg-[#101010]/90 p-7 text-center shadow-2xl backdrop-blur md:p-10">
          <div className="pointer-events-none absolute -right-4 -top-9 text-[7rem] font-black leading-none text-primary/[0.08] md:text-[11rem]">
            404
          </div>
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-primary/35 bg-primary/10 text-primary shadow-[0_0_32px_rgba(214,255,0,0.18)]">
            <AlertCircle className="h-8 w-8" />
          </div>

          <p className="mb-3 text-sm font-black uppercase tracking-[0.34em] text-primary">404</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Sayfa bulunamadı</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
            Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
          </p>

          <form
            className="mx-auto mt-6 flex max-w-lg gap-2 rounded-2xl border border-white/10 bg-black/30 p-2"
            onSubmit={(event) => {
              event.preventDefault();
              window.location.href = "/";
            }}
          >
            <div className="flex min-h-11 flex-1 items-center gap-2 px-3 text-left">
              <Search className="h-4 w-4 text-primary" />
              <input
                aria-label="Sayfa ara"
                placeholder="Bio link, QR kod veya blog ara"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
            </div>
            <Button type="submit" className="h-11 bg-primary px-4 font-bold text-black hover:bg-primary/90">Ara</Button>
          </form>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/">
              <Button className="h-12 w-full gap-2 bg-primary px-6 font-bold text-black hover:bg-primary/90 sm:w-auto">
                <Home className="h-4 w-4" />
                Ana Sayfaya Dön
              </Button>
            </Link>
            <Link href="/kayit">
              <Button variant="outline" className="h-12 w-full gap-2 border-white/15 bg-white/5 px-6 font-bold text-white hover:bg-white/10 sm:w-auto">
                <UserPlus className="h-4 w-4" />
                Ücretsiz Hesap Oluştur
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left">
            <h2 className="text-sm font-black text-white">Popüler sayfalar</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                ["/bio-duzenleyici", "Bio Düzenleyici"],
                ["/link-kisaltici", "Link Kısaltıcı"],
                ["/qr-olusturucu", "QR Oluşturucu"],
                ["/blog", "Blog"],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm font-bold text-white/75 hover:border-primary/35 hover:text-primary">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
