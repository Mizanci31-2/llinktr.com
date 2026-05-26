import { Link } from "wouter";
import { Instagram, Link2, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-[1.25fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2">
              <img src="/site-logo.png" alt="llinktr" className="h-12 w-auto max-w-[170px] object-contain" loading="lazy" />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Linklerini, satış akışlarını ve sosyal hesaplarını tek hızlı bio sayfasında topla.
            </p>
            <div className="mt-5 flex gap-2">
              <a href="https://www.instagram.com/llinktr.destek/" target="_blank" rel="noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition-all hover:border-primary/45 hover:text-primary hover:shadow-[0_0_22px_rgba(223,255,0,0.16)]">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="mailto:destekmerkezi31@gmail.com" aria-label="E-posta" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition-all hover:border-primary/45 hover:text-primary hover:shadow-[0_0_22px_rgba(223,255,0,0.16)]">
                <Mail className="h-4 w-4" />
              </a>
              <Link href="/dashboard" aria-label="Panel" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition-all hover:border-primary/45 hover:text-primary hover:shadow-[0_0_22px_rgba(223,255,0,0.16)]">
                <Link2 className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ürün</h4>
            <ul className="space-y-3">
              <li><Link href="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Bio Düzenleyici</Link></li>
              <li><Link href="/shortener" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Link Kısaltıcı</Link></li>
              <li><Link href="/qr" className="text-sm text-muted-foreground transition-colors hover:text-foreground">QR Oluşturucu</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Şirket</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Hakkımızda</Link></li>
              <li><Link href="/contact" className="text-sm text-muted-foreground transition-colors hover:text-foreground">İletişim</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Yasal</h4>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Gizlilik Politikası</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Kullanım Şartları</Link></li>
              <li><Link href="/cookies" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Çerez Politikası</Link></li>
              <li><Link href="/kvkk" className="text-sm text-muted-foreground transition-colors hover:text-foreground">KVKK</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-9 border-t border-white/10 pt-5">
          <p className="text-xs leading-relaxed text-muted-foreground/75">
            © 2026 llinktr. İçerik üreticileri ve küçük işletmeler için geliştirildi.
          </p>
        </div>

        <div className="site-bottom-ad">
          <div id="container-07bb46412fafa1364a635fe7124defe7"></div>
        </div>
      </div>
    </footer>
  );
}
