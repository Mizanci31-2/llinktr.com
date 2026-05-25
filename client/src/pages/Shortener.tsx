import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MondiadNativeAd from "@/components/MondiadNativeAd";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import {
  Link2,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  ArrowRight,
  BarChart3,
  ShieldCheck,
  Zap,
  Trash2,
} from "lucide-react";

type ShortenerResult = {
  id?: number;
  code: string;
  shortUrl: string;
  originalUrl: string;
};

export default function Shortener() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const [url, setUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [result, setResult] = useState<ShortenerResult | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: shortLinks } = trpc.shortLinks.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createMutation = trpc.shortLinks.create.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success("Kisa link olusturuldu");
      utils.shortLinks.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Gecerli bir URL girin"),
  });

  const deleteMutation = trpc.shortLinks.delete.useMutation({
    onSuccess: () => {
      toast.success("Kisa link silindi");
      utils.shortLinks.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Link silinemedi"),
  });

  useEffect(() => {
    if (!result?.code) return;
    if (result.id) return;
    if (!shortLinks) return;
    const match = shortLinks.find((item) => item.code === result.code);
    if (!match?.id) return;
    setResult((prev) => (prev && prev.code === match.code ? { ...prev, id: match.id } : prev));
  }, [result?.code, result?.id, shortLinks]);

  const handleShorten = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    createMutation.mutate({
      url: trimmedUrl,
      customCode: customCode.trim() || undefined,
    });
  };

  const handleCustomCodeChange = (value: string) => {
    setCustomCode(
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+/g, "")
        .slice(0, 20),
    );
  };

  const copyLink = async (shortUrl: string, code: string) => {
    const fullUrl = new URL(shortUrl, window.location.origin).toString();
    await navigator.clipboard.writeText(fullUrl);
    setCopiedCode(code);
    toast.success("Kopyalandi");
    window.setTimeout(() => setCopiedCode(current => current === code ? null : current), 1800);
  };

  const handleDelete = async (id: number, code: string) => {
    await deleteMutation.mutateAsync({ id });
    setResult(prev => prev?.code === code ? null : prev);
  };

  const resultFullUrl = result ? new URL(result.shortUrl, window.location.origin).toString() : "";
  const resultDisplayUrl = resultFullUrl.replace(/^https?:\/\//, "");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="container flex-1 py-12">
        <div className="mx-auto max-w-[58rem]">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-400/10">
              <Link2 className="h-7 w-7 text-blue-400" />
            </div>
            <h1 className="mb-3 text-3xl font-bold">Link Kisaltici</h1>
            <p className="text-muted-foreground">Uzun URL'leri akilda kalici kisa linklere donusturun ve isterseniz sonradan kaldirin.</p>
          </div>

          <div className="mb-6 rounded-2xl border border-border/50 bg-card p-6">
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                URL Girin
              </label>
              <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
                <Textarea
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && (event.ctrlKey || event.metaKey) && handleShorten()}
                  placeholder="example.com/cok/uzun/bir/yol?utm_source=kampanya&ref=profil..."
                  className="min-h-[110px] resize-none bg-input text-sm"
                  rows={4}
                />
                <div className="space-y-3">
                  <Input
                    value={customCode}
                    onChange={(event) => handleCustomCodeChange(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && handleShorten()}
                    placeholder="kisa-ad (opsiyonel)"
                    className="bg-input"
                    maxLength={20}
                  />
                  <Button
                    onClick={handleShorten}
                    disabled={!url.trim() || createMutation.isPending}
                    className="h-11 w-full bg-primary text-primary-foreground shadow-[0_0_15px_oklch(0.93_0.23_110/0.25)] hover:bg-primary/90"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Kisalt
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    10.000 karaktere kadar uzun link kabul edilir. Kisa ad bos kalirsa sistem okunabilir bir kod uretir.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {result && (
            <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-[0_0_30px_oklch(0.93_0.23_110/0.08)]">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="text-sm font-semibold text-primary">Kisa link hazir</span>
              </div>

              <div className="mb-4 flex items-center gap-3 rounded-xl border border-border/50 bg-muted/50 p-4">
                <Link2 className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate font-mono text-sm font-semibold text-foreground">
                  {resultDisplayUrl}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <a href={resultFullUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                  <Button
                    onClick={() => void copyLink(result.shortUrl, result.code)}
                    size="sm"
                    className={`h-8 px-3 text-xs ${copiedCode === result.code ? "border-green-500/30 bg-green-500/20 text-green-400" : "bg-primary text-primary-foreground"}`}
                  >
                    {copiedCode === result.code ? (
                      <>
                        <Check className="mr-1 h-3 w-3" />
                        Kopyalandi
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-3 w-3" />
                        Kopyala
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-border/50 px-3 text-xs text-destructive hover:text-destructive"
                    disabled={deleteMutation.isPending || !result.id}
                    onClick={() => result.id && void handleDelete(result.id, result.code)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Sil
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Orijinal URL: </span>
                <span className="break-all">{result.originalUrl}</span>
              </div>

              <div className="mt-4 border-t border-border/30 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border/50 text-xs"
                  onClick={() => {
                    setResult(null);
                    setUrl("");
                    setCustomCode("");
                  }}
                >
                  Yeni Link Kısalt
                </Button>
              </div>
            </div>
          )}

          {shortLinks && shortLinks.length > 0 && (
            <div className="mt-8 rounded-2xl border border-border/50 bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Link Analizi</h2>
              </div>
              <div className="space-y-3">
                {shortLinks.slice(0, 12).map((link) => {
                  const linkShortUrl = `${window.location.origin}/r/${link.code}`;
                  const isCopied = copiedCode === link.code;

                  return (
                    <div key={link.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 p-3">
                      <Link2 className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs">{window.location.host}/r/{link.code}</p>
                        <p className="truncate text-xs text-muted-foreground">{link.originalUrl}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{link.clicks}</p>
                        <p className="text-[11px] text-muted-foreground">tiklama</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <a href={linkShortUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => void copyLink(linkShortUrl, link.code)}
                        >
                          {isCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => void handleDelete(link.id, link.code)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: Zap, title: "Anlik", desc: "Saniyeler icinde kisa link" },
              { icon: ShieldCheck, title: "Guvenilir", desc: "Kalici ve stabil linkler" },
              { icon: BarChart3, title: "Takip", desc: "Tiklama istatistikleri" },
            ].map((item, index) => (
              <div key={index} className="rounded-xl border border-border/50 bg-card p-4 text-center">
                <item.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <MondiadNativeAd className="pb-10" />
      <Footer />
    </div>
  );
}
