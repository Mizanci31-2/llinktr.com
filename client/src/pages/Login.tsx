import { useEffect, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Lock, Mail, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

type AuthMode = "signIn" | "signUp";

const GOOGLE_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
    <path
      fill="currentColor"
      d="M21.6 12.23c0-.68-.06-1.33-.17-1.95H12v3.69h5.39a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.97-4.33 2.97-7.27Z"
    />
    <path
      fill="currentColor"
      d="M12 22c2.7 0 4.97-.9 6.63-2.43l-3.24-2.51c-.9.61-2.05.97-3.39.97-2.61 0-4.82-1.76-5.61-4.12H3.05v2.59A10 10 0 0 0 12 22Z"
    />
    <path
      fill="currentColor"
      d="M6.39 13.91A5.99 5.99 0 0 1 6.08 12c0-.66.11-1.3.31-1.91V7.5H3.05A10 10 0 0 0 2 12c0 1.61.39 3.13 1.05 4.5l3.34-2.59Z"
    />
    <path
      fill="currentColor"
      d="M12 5.97c1.47 0 2.8.5 3.85 1.49l2.88-2.88C16.96 2.94 14.7 2 12 2A10 10 0 0 0 3.05 7.5l3.34 2.59c.79-2.36 3-4.12 5.61-4.12Z"
    />
  </svg>
);

export default function Login() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleStatusLoading, setGoogleStatusLoading] = useState(true);
  const [googleDisabledReason, setGoogleDisabledReason] = useState<string>("");

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    const fetchAuthStatus = async () => {
      try {
        const response = await fetch("/api/dev-auth-status", {
          credentials: "include",
        });
        const data = await response.json().catch(() => null);
        if (response.ok && data?.success) {
          const isGoogleEnabled = Boolean(data.googleEnabled);
          setGoogleEnabled(isGoogleEnabled);
          if (!isGoogleEnabled) {
            setGoogleDisabledReason("Google girisi aktif degil. Supabase panelinden Google provider acilmali.");
          }
          return;
        }
        setGoogleEnabled(false);
        setGoogleDisabledReason("Google girisi simdilik kullanilamiyor.");
      } catch {
        setGoogleEnabled(false);
        setGoogleDisabledReason("Google girisi simdilik kullanilamiyor.");
      } finally {
        setGoogleStatusLoading(false);
      }
    };

    void fetchAuthStatus();
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token=")) return;

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    if (!accessToken) return;

    const finishGoogleSignIn = async () => {
      try {
        const profileRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/user`, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const profile = await profileRes.json();
        if (!profileRes.ok || !profile?.id || !profile?.email) {
          throw new Error(profile?.msg || "Google profili alinmadi");
        }

        const redirect = "/dashboard";
        const completeRes = await fetch("/api/dev-social-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            providerUserId: profile.id,
            email: profile.email,
            name:
              profile.user_metadata?.full_name ||
              profile.user_metadata?.name ||
              profile.email?.split("@")?.[0] ||
              "Kullanici",
            redirect,
          }),
        });
        const completeData = await completeRes.json().catch(() => null);
        if (!completeRes.ok || !completeData?.success) {
          throw new Error(completeData?.message || "Google girisi tamamlanamadi");
        }

        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        window.location.href = completeData.redirect || "/dashboard";
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Google girisi basarisiz");
      }
    };

    void finishGoogleSignIn();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error") || params.get("error_description");
    if (error) {
      toast.error(`Google girisi basarisiz: ${error}`);
      params.delete("error");
      params.delete("error_description");
      const nextQuery = params.toString();
      const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
      window.history.replaceState(null, "", nextUrl);
    }
  }, []);

  const submitLocalAuth = async (event: FormEvent) => {
    event.preventDefault();

    setSubmitting(true);

    try {
      const endpoint = mode === "signIn" ? "/api/dev-login" : "/api/dev-register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          password,
          redirect: "/dashboard",
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Islem tamamlanamadi");
      }

      toast.success(mode === "signIn" ? "Giris yapildi" : "Hesap olusturuldu");
      window.location.href = data.redirect || "/dashboard";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Islem tamamlanamadi");
    } finally {
      setSubmitting(false);
    }
  };

  const continueWithGoogle = async () => {
    if (!googleEnabled) {
      toast.error(googleDisabledReason || "Google girisi aktif degil.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/dev-social-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          provider: "google",
          mode,
          redirect: "/dashboard",
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Google giris akisi baslatilamadi");
      }

      if (typeof data?.redirect === "string" && data.redirect.length > 0) {
        window.location.href = data.redirect;
        return;
      }

      window.location.href = "/dashboard";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google ile giris basarisiz");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/50 py-16 md:py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[8%] top-[8%] h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute right-[10%] top-[10%] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute bottom-[8%] left-[28%] h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />
          </div>

          <div className="container relative">
            <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1fr_440px]">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/80 px-3 py-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Bio link, kisa link ve QR yonetimi tek panelde
                </div>
                <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                  llinktr hesabiniza
                  <br />
                  <span className="text-primary">{mode === "signIn" ? "giris yapin." : "kayit olun."}</span>
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                  Bio sayfalarinizi olusturun, linklerinizi kisaltin, QR kodlarinizi yonetin ve tum iceriginizi tek yerden yayinlayin.
                </p>

                <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/50 bg-card/80 p-4">
                    <p className="text-xs text-muted-foreground">Aninda yayin</p>
                    <p className="mt-1 text-sm font-semibold">Tema ve bloklar canli guncellenir</p>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-card/80 p-4">
                    <p className="text-xs text-muted-foreground">Tek panel</p>
                    <p className="mt-1 text-sm font-semibold">Bio, kisa link ve QR tek akista</p>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-card/80 p-4">
                    <p className="text-xs text-muted-foreground">Hizli erisim</p>
                    <p className="mt-1 text-sm font-semibold">Telefon ve masaustu onizleme hazir</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-border/50 bg-card/90 p-6 shadow-2xl backdrop-blur">
                <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-border/50 bg-background/70 p-1">
                  <button
                    type="button"
                    onClick={() => setMode("signIn")}
                    className={`rounded-[1rem] px-4 py-2.5 text-sm font-medium transition-colors ${mode === "signIn" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Giris Yap
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("signUp")}
                    className={`rounded-[1rem] px-4 py-2.5 text-sm font-medium transition-colors ${mode === "signUp" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Kayit Ol
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-semibold">{mode === "signIn" ? "Hesabiniza giris yapin" : "Yeni hesap olusturun"}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      E-posta ile giris veya kayit olabilir, Google ile de tek tikla devam edebilirsiniz.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={submitting || googleStatusLoading || !googleEnabled}
                    onClick={continueWithGoogle}
                    className="w-full justify-center gap-2 border-border/60 bg-background/70"
                  >
                    {GOOGLE_ICON}
                    {mode === "signIn" ? "Google ile giris yap" : "Google ile kayit ol"}
                  </Button>
                  {!googleStatusLoading && !googleEnabled && (
                    <p className="text-xs text-amber-300/90">{googleDisabledReason}</p>
                  )}

                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-3 text-xs text-muted-foreground">veya e-posta ile devam edin</span>
                    </div>
                  </div>

                  <form className="space-y-4" onSubmit={submitLocalAuth}>
                    {mode === "signUp" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Kullanici adi</label>
                        <div className="relative">
                          <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="pl-10"
                            placeholder="Kullanici adiniz"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium">E-posta</label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className="pl-10"
                          placeholder="ornek@mail.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sifre</label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className="pl-10"
                          placeholder="Sifreniz"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={
                        submitting ||
                        !email ||
                        !password ||
                        (mode === "signUp" && !name.trim())
                      }
                      className="w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      {submitting
                        ? "Islem yapiliyor..."
                        : mode === "signIn"
                            ? "Giris Yap"
                            : "Hesap Olustur"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
