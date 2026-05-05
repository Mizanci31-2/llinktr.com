import { useEffect, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Lock, Mail, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

type AuthMode = "signIn" | "signUp" | "forgot" | "reset";

const GOOGLE_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
    <path fill="currentColor" d="M21.6 12.23c0-.68-.06-1.33-.17-1.95H12v3.69h5.39a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.97-4.33 2.97-7.27Z" />
    <path fill="currentColor" d="M12 22c2.7 0 4.97-.9 6.63-2.43l-3.24-2.51c-.9.61-2.05.97-3.39.97-2.61 0-4.82-1.76-5.61-4.12H3.05v2.59A10 10 0 0 0 12 22Z" />
    <path fill="currentColor" d="M6.39 13.91A5.99 5.99 0 0 1 6.08 12c0-.66.11-1.3.31-1.91V7.5H3.05A10 10 0 0 0 2 12c0 1.61.39 3.13 1.05 4.5l3.34-2.59Z" />
    <path fill="currentColor" d="M12 5.97c1.47 0 2.8.5 3.85 1.49l2.88-2.88C16.96 2.94 14.7 2 12 2A10 10 0 0 0 3.05 7.5l3.34 2.59c.79-2.36 3-4.12 5.61-4.12Z" />
  </svg>
);

function readUrlState() {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return { searchParams, hashParams };
}

export default function Login() {
  const [location, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>(() => (window.location.pathname.includes("kayitol") || window.location.pathname.includes("register") ? "signUp" : "signIn"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetAccessToken, setResetAccessToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleStatusLoading, setGoogleStatusLoading] = useState(true);
  const [googleDisabledReason, setGoogleDisabledReason] = useState("");

  const switchAuthMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    if (nextMode === "signIn") navigate("/giris");
    if (nextMode === "signUp") navigate("/kayitol");
  };

  useEffect(() => {
    if (mode === "forgot" || mode === "reset") return;
    setMode(location === "/kayitol" || location === "/register" ? "signUp" : "signIn");
  }, [location, mode]);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    const fetchAuthStatus = async () => {
      try {
        const response = await fetch("/api/dev-auth-status", { credentials: "include" });
        const data = await response.json().catch(() => null);
        if (response.ok && data?.success) {
          const enabled = Boolean(data.googleEnabled);
          setGoogleEnabled(enabled);
          if (!enabled) setGoogleDisabledReason("Google girişi yakında aktif olacak.");
          return;
        }
        setGoogleEnabled(false);
        setGoogleDisabledReason("Google girişi şu an kullanılamıyor.");
      } catch {
        setGoogleEnabled(false);
        setGoogleDisabledReason("Google girişi şu an kullanılamıyor.");
      } finally {
        setGoogleStatusLoading(false);
      }
    };

    void fetchAuthStatus();
  }, []);

  useEffect(() => {
    const { searchParams, hashParams } = readUrlState();
    const accessToken = hashParams.get("access_token");
    if (!accessToken) return;

    if (hashParams.get("type") === "recovery" || searchParams.get("reset") === "1") {
      setResetAccessToken(accessToken);
      setMode("reset");
      window.history.replaceState(null, "", "/giris?reset=1");
      return;
    }

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
          throw new Error(profile?.msg || "Google profili alınamadı");
        }

        const completeRes = await fetch("/api/dev-social-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            providerUserId: profile.id,
            email: profile.email,
            name: profile.user_metadata?.full_name || profile.user_metadata?.name || profile.email.split("@")[0] || "Kullanıcı",
            redirect: "/dashboard",
          }),
        });
        const completeData = await completeRes.json().catch(() => null);
        if (!completeRes.ok || !completeData?.success) {
          throw new Error(completeData?.message || "Google girişi tamamlanamadı");
        }

        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        window.location.href = completeData.redirect || "/dashboard";
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Google girişi başarısız");
      }
    };

    void finishGoogleSignIn();
  }, []);

  useEffect(() => {
    const { searchParams, hashParams } = readUrlState();
    const errorCode = hashParams.get("error_code") || searchParams.get("error_code") || "";
    const error = hashParams.get("error") || searchParams.get("error") || "";
    const errorDescription = hashParams.get("error_description") || searchParams.get("error_description") || "";
    if (!error && !errorDescription && !errorCode) return;

    const normalizedDescription = decodeURIComponent(errorDescription.replace(/\+/g, " "));
    const authErrorText = [errorCode, error, normalizedDescription].filter(Boolean).join(" ").toLowerCase();
    const recoveryError = searchParams.get("reset") === "1" || authErrorText.includes("otp_expired") || authErrorText.includes("expired") || authErrorText.includes("invalid") || authErrorText.includes("recovery");

    if (recoveryError) {
      setMode("forgot");
      setResetAccessToken("");
      toast.error("Şifre sıfırlama bağlantısının süresi dolmuş olabilir. Yeni bir bağlantı isteyin.");
    } else {
      toast.error(`Google girişi başarısız: ${normalizedDescription || errorCode || error}`);
    }

    searchParams.delete("error");
    searchParams.delete("error_code");
    searchParams.delete("error_description");
    const nextQuery = searchParams.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`);
  }, []);

  const submitLocalAuth = async (event: FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !password.trim() || (mode === "signUp" && !name.trim())) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }

    if (password.trim().length < 6) {
      toast.error("Şifre en az 6 karakter olmalı");
      return;
    }

    setSubmitting(true);

    try {
      const endpoint = mode === "signIn" ? "/api/dev-login" : "/api/dev-register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, redirect: "/dashboard" }),
      });
      const rawText = await response.text();
      let data: { success?: boolean; message?: string; redirect?: string } | null = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = null;
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || rawText || "İşlem tamamlanamadı");
      }

      toast.success(mode === "signIn" ? "Giriş yapıldı" : "Hesap oluşturuldu");
      window.location.href = data.redirect || "/dashboard";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "İşlem tamamlanamadı");
    } finally {
      setSubmitting(false);
    }
  };

  const submitPasswordResetRequest = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/dev-password-reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.message || "Şifre yenileme başlatılamadı");

      toast.success(data.message || "Şifre yenileme bağlantısı gönderildi");
      switchAuthMode("signIn");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Şifre yenileme başlatılamadı");
    } finally {
      setSubmitting(false);
    }
  };

  const submitNewPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword.trim().length < 6) {
      toast.error("Yeni şifre en az 6 karakter olmalı");
      return;
    }
    if (!resetAccessToken) {
      toast.error("Şifre yenileme oturumu bulunamadı. E-postadaki bağlantıya tekrar basın.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${resetAccessToken}`,
        },
        body: JSON.stringify({ password: newPassword.trim() }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.msg || data?.error_description || "Şifre güncellenemedi");

      toast.success("Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.");
      setPassword("");
      setNewPassword("");
      setResetAccessToken("");
      switchAuthMode("signIn");
      window.history.replaceState(null, "", "/giris");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Şifre güncellenemedi");
    } finally {
      setSubmitting(false);
    }
  };

  const continueWithGoogle = async () => {
    if (!googleEnabled) {
      toast.error(googleDisabledReason || "Google girişi aktif değil.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/dev-social-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ provider: "google", mode, redirect: "/dashboard" }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.message || "Google girişi başlatılamadı");
      window.location.href = typeof data.redirect === "string" && data.redirect ? data.redirect : "/dashboard";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google ile giriş başarısız");
      setSubmitting(false);
    }
  };

  const title = mode === "signIn" ? "Hesabına giriş yap" : mode === "signUp" ? "Yeni hesap oluştur" : mode === "forgot" ? "Şifreni yenile" : "Yeni şifre belirle";
  const subtitle = mode === "forgot"
    ? "E-posta adresini yaz, şifre yenileme bağlantısını gönderelim."
    : mode === "reset"
      ? "E-postadaki bağlantı doğrulandı. Yeni şifreni belirleyebilirsin."
      : "E-posta ile devam et, sayfanı oluştur ve dashboard'a yönlen.";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/50 py-14 md:py-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[8%] top-[8%] h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute right-[10%] top-[10%] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          </div>

          <div className="container relative">
            <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1fr_440px]">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/80 px-3 py-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Bio link, kısa link ve QR yönetimi tek panelde
                </div>
                <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                  llinktr hesabına
                  <br />
                  <span className="text-primary">{mode === "signIn" ? "giriş yap." : mode === "signUp" ? "kayıt ol." : mode === "forgot" ? "şifreni yenile." : "yeni şifre belirle."}</span>
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                  Bio sayfalarını oluştur, linklerini kısalt, QR kodlarını yönet ve tüm içeriğini tek yerden yayınla.
                </p>
              </div>

              <div className="rounded-[1.8rem] border border-border/50 bg-card/90 p-6 shadow-2xl backdrop-blur">
                <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-border/50 bg-background/70 p-1">
                  <button type="button" onClick={() => switchAuthMode("signIn")} className={`rounded-[1rem] px-4 py-2.5 text-sm font-medium transition-colors ${mode === "signIn" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Giriş Yap</button>
                  <button type="button" onClick={() => switchAuthMode("signUp")} className={`rounded-[1rem] px-4 py-2.5 text-sm font-medium transition-colors ${mode === "signUp" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Hesap Oluştur</button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-semibold">{title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
                  </div>

                  {(mode === "signIn" || mode === "signUp") && (
                    <>
                      <Button type="button" variant="outline" size="lg" disabled={submitting || googleStatusLoading || !googleEnabled} onClick={continueWithGoogle} className="w-full justify-center gap-2 border-border/60 bg-background/70">
                        {GOOGLE_ICON}
                        {mode === "signIn" ? "Google ile giriş yap" : "Google ile kayıt ol"}
                      </Button>
                      {!googleStatusLoading && !googleEnabled && <p className="text-xs text-amber-300/90">{googleDisabledReason}</p>}
                      <div className="relative py-1">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
                        <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">veya e-posta ile devam et</span></div>
                      </div>
                    </>
                  )}

                  {mode === "forgot" && (
                    <form className="space-y-4" onSubmit={submitPasswordResetRequest}>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">E-posta</label>
                        <div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-10" placeholder="ornek@mail.com" /></div>
                      </div>
                      <Button type="submit" size="lg" disabled={submitting || !email} className="w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90">{submitting ? "Gönderiliyor..." : "Şifre yenileme bağlantısı gönder"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
                      <button type="button" onClick={() => switchAuthMode("signIn")} className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground">Giriş ekranına dön</button>
                    </form>
                  )}

                  {mode === "reset" && (
                    <form className="space-y-4" onSubmit={submitNewPassword}>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Yeni şifre</label>
                        <div className="relative"><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="pl-10" placeholder="Yeni şifren" /></div>
                      </div>
                      <Button type="submit" size="lg" disabled={submitting || newPassword.trim().length < 6} className="w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90">{submitting ? "Güncelleniyor..." : "Şifreyi güncelle"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </form>
                  )}

                  {(mode === "signIn" || mode === "signUp") && (
                    <form className="space-y-4" onSubmit={submitLocalAuth}>
                      {mode === "signUp" && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Kullanıcı adı</label>
                          <div className="relative"><UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={name} onChange={(event) => setName(event.target.value)} className="pl-10" placeholder="Kullanıcı adın" /></div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">E-posta</label>
                        <div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-10" placeholder="ornek@mail.com" /></div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <label className="text-sm font-medium">Şifre</label>
                          {mode === "signIn" && <button type="button" onClick={() => setMode("forgot")} className="text-xs font-semibold text-primary hover:text-primary/80">Şifremi unuttum</button>}
                        </div>
                        <div className="relative"><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-10" placeholder="Şifren" /></div>
                      </div>
                      <Button type="submit" size="lg" disabled={submitting || !email || !password || (mode === "signUp" && !name.trim())} className="w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
                        {submitting ? "İşlem yapılıyor..." : mode === "signIn" ? "Giriş Yap" : "Hesap Oluştur"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <button type="button" onClick={() => switchAuthMode(mode === "signIn" ? "signUp" : "signIn")} className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground">
                        {mode === "signIn" ? "Hesabın yok mu? Hesap oluştur" : "Zaten hesabın var mı? Giriş yap"}
                      </button>
                    </form>
                  )}
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
