import { AlertCircle, ArrowRight, Home, UserPlus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export function ProfileNotFound() {
  useEffect(() => {
    document.title = "Bu sayfa bulunamad1 | Llinktr";

    const setMeta = (selector: string, create: () => HTMLMetaElement, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = create();
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta("meta[name='description']", () => {
      const meta = document.createElement("meta");
      meta.name = "description";
      return meta;
    }, "Arad11n1z Llinktr profili silinmi_, dei_tirilmi_ veya hi� olu_turulmam1_ olabilir.");

    setMeta("meta[name='robots']", () => {
      const meta = document.createElement("meta");
      meta.name = "robots";
      return meta;
    }, "noindex,follow");
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-12 text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[10%] top-[14%] h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[8%] top-[10%] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-[78vh] max-w-3xl items-center justify-center">
        <section className="relative w-full overflow-hidden rounded-[2rem] border border-white/12 bg-[#101010]/92 p-7 shadow-2xl backdrop-blur md:p-10">
          <div className="pointer-events-none absolute -right-4 -top-9 text-[7rem] font-black leading-none text-primary/[0.08] md:text-[11rem]">
            404
          </div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
            <AlertCircle className="h-4 w-4" />
            Profil bulunamad1
          </div>

          <p className="mb-3 text-sm font-black uppercase tracking-[0.34em] text-primary">404</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Bu sayfa bulunamad1</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/72">
            Arad11n1z Llinktr profili silinmi_, dei_tirilmi_ veya hi� olu_turulmam1_ olabilir.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60 md:text-base">
            Kendi link sayfan1z1 �cretsiz olu_turarak t�m balant1lar1n1z1 tek yerde payla_abilirsiniz.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/kayit">
              <Button className="h-12 w-full gap-2 bg-primary px-6 font-extrabold text-black hover:bg-primary/90 sm:w-auto">
                <UserPlus className="h-4 w-4" />
                �cretsiz Hesap Olu_tur
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="h-12 w-full gap-2 border-white/15 bg-white/5 px-6 font-bold text-white hover:bg-white/10 sm:w-auto">
                <Home className="h-4 w-4" />
                Ana Sayfaya D�n
              </Button>
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-sm font-bold text-white">Neden bu sayfay1 g�r�yorum?</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/62">
              <li>Kullan1c1 ad1 yanl1_ yaz1lm1_ olabilir.</li>
              <li>Profil sahibi hesab1n1 silmi_ olabilir.</li>
              <li>Profil balant1s1 dei_tirilmi_ olabilir.</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
