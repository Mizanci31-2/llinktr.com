import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Menu, X, Link2, QrCode, LayoutDashboard, Zap } from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard, authRequired: true },
  { href: "/shortener", label: "Link Kısaltıcı", icon: Link2, authRequired: true },
  { href: "/qr", label: "QR Kod", icon: QrCode, authRequired: true },
];

export default function Navbar() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="group flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              llinktr
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              if (link.authRequired && !isAuthenticated) return null;
              const isActive = location === link.href || location.startsWith(link.href + "/");

              return (
                <Link key={link.href} href={link.href}>
                  <button
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-b-2 border-primary pb-[6px] text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </button>
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    Panel
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  className="border-border/50 text-muted-foreground hover:text-foreground"
                >
                  Çıkış
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <a href={getLoginUrl()}>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    Giriş
                  </Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button size="sm" className="bg-primary font-semibold text-primary-foreground shadow-[0_0_15px_oklch(0.93_0.23_110/0.3)] hover:bg-primary/90">
                    Başla
                  </Button>
                </a>
              </div>
            )}
          </div>

          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="space-y-1 border-t border-border/50 py-4 md:hidden">
            {navLinks.map((link) => {
              if (link.authRequired && !isAuthenticated) return null;

              return (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                  <div className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
                    <link.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </div>
                </Link>
              );
            })}

            <div className="flex flex-col gap-2 border-t border-border/50 px-4 pt-3">
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logoutMutation.mutate();
                    setMobileOpen(false);
                  }}
                  className="w-full"
                >
                  Çıkış Yap
                </Button>
              ) : (
                <>
                  <a href={getLoginUrl()} className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      Giriş Yap
                    </Button>
                  </a>
                  <a href={getLoginUrl()} className="w-full">
                    <Button size="sm" className="w-full bg-primary text-primary-foreground">
                      Ücretsiz Başla
                    </Button>
                  </a>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
