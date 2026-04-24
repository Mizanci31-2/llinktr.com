import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Home, LayoutDashboard, Link2, QrCode, Zap } from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard, authRequired: true },
  { href: "/shortener", label: "Link Kisaltici", icon: Link2, authRequired: true },
  { href: "/qr", label: "QR Kod", icon: QrCode, authRequired: true },
];

const authMenuLinks = [
  { href: "/", label: "Ana Sayfa", icon: Home },
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/shortener", label: "Link Kisaltici", icon: Link2 },
  { href: "/qr", label: "QR Kod", icon: QrCode },
];

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const isActiveLink = (href: string) => location === href || location.startsWith(`${href}/`);

  return (
    <nav className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "linear-gradient(90deg, rgba(250,204,21,0.07) 0%, rgba(34,211,238,0.05) 40%, rgba(168,85,247,0.08) 100%)",
        }}
      />

      <div className="container relative">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href="/" className="group flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-[0_0_18px_oklch(0.93_0.23_110/0.35)]">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              llinktr
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              if (link.authRequired && !isAuthenticated) return null;
              return (
                <button
                  key={link.href}
                  onClick={() => setLocation(link.href)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActiveLink(link.href)
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Button
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  className="hidden h-10 bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-[0_0_15px_oklch(0.93_0.23_110/0.3)] hover:bg-primary/90 md:inline-flex md:px-4 md:text-sm"
                >
                  Cikis Yap
                </Button>
                <div className="sm:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 border-2 border-primary/95 !bg-primary !text-white shadow-[0_0_0_1px_rgba(250,204,21,0.45)] hover:!bg-primary/90"
                        aria-label="Hizli menu"
                      >
                        <span aria-hidden className="flex h-4 w-4 flex-col items-center justify-center gap-[3px]">
                          <span className="block h-[2px] w-4 rounded-full bg-black" />
                          <span className="block h-[2px] w-4 rounded-full bg-black" />
                          <span className="block h-[2px] w-4 rounded-full bg-black" />
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60 border-border/80 bg-card/95 p-2 backdrop-blur-xl">
                      <DropdownMenuLabel className="px-2 pb-2 pt-1">
                        <p className="truncate text-sm font-semibold">{user?.name || "Kullanici"}</p>
                        <p className="truncate text-xs text-muted-foreground">{user?.email || "-"}</p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {authMenuLinks.map((item) => (
                        <DropdownMenuItem
                          key={item.href}
                          onSelect={() => setLocation(item.href)}
                          className="mt-1 rounded-md border border-transparent px-2.5 py-2 text-sm focus:border-border/80"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuItem
                        onSelect={() => logoutMutation.mutate()}
                        className="rounded-md border border-primary/70 bg-primary px-2.5 py-2.5 text-center font-semibold text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground"
                      >
                        Cikis Yap
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="outline" size="sm" className="h-10 border-primary/60 bg-card/85 px-3 text-xs font-semibold sm:px-4 sm:text-sm">
                    Giris Yap
                  </Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button size="sm" className="h-10 bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-[0_0_15px_oklch(0.93_0.23_110/0.3)] hover:bg-primary/90 sm:px-4 sm:text-sm">
                    Basla
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
