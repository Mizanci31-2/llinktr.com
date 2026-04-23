import { Link } from "wouter";
import { Zap } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Footer() {
  const { isAuthenticated } = useAuth();

  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="container py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>llinktr</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tüm linklerinizi tek bir profilde toplayın. Profesyonel varlığınızı tek noktadan yönetin.
            </p>
            <p className="text-xs text-muted-foreground mt-4">© 2026 llinktr. İçerik üreticileri için geliştirildi.</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Ürün</h4>
            <ul className="space-y-3">
              <li><Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Bio Düzenleyici</Link></li>
              {isAuthenticated && (
                <>
                  <li><Link href="/shortener" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Link Kısaltıcı</Link></li>
                  <li><Link href="/qr" className="text-sm text-muted-foreground hover:text-foreground transition-colors">QR Oluşturucu</Link></li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Şirket</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Hakkımızda</Link></li>
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">İletişim</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Yasal</h4>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Gizlilik Politikası</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Kullanım Şartları</Link></li>
              <li><Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Çerez Politikası</Link></li>
              <li><Link href="/kvkk" className="text-sm text-muted-foreground hover:text-foreground transition-colors">KVKK</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
