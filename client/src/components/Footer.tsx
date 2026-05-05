import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Instagram, Link2, Mail } from "lucide-react";

export default function Footer() {
  const { isAuthenticated } = useAuth();

  return (
    <footer className="border-t border-white/8 bg-[#0d0d0d]">
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
              <a href="https://www.instagram.com/llinktr.destek/" target="_blank" rel="noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="mailto:destekmerkezi31@gmail.com" aria-label="E-posta" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                <Mail className="h-4 w-4" />
              </a>
              <Link href="/dashboard" aria-label="Panel" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                <Link2 className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-5 text-xs text-muted-foreground/75">© 2026 llinktr. İçerik üreticileri ve küçük işletmeler için geliştirildi.</p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ürün</h4>
            <ul className="space-y-3">
              <li><Link href="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Bio Düzenleyici</Link></li>
              {isAuthenticated && (
                <>
                  <li><Link href="/shortener" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Link Kısaltıcı</Link></li>
                  <li><Link href="/qr" className="text-sm text-muted-foreground transition-colors hover:text-foreground">QR Oluşturucu</Link></li>
                </>
              )}
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
      </div>
    </footer>
  );
}