import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { QrCode, Download, Loader2 } from "lucide-react";

type QRType = "url" | "phone" | "email" | "text" | "whatsapp";

const QR_TYPES: { id: QRType; label: string; placeholder: string; icon: string }[] = [
  { id: "url", label: "URL", placeholder: "https://example.com", icon: "🔗" },
  { id: "phone", label: "Telefon", placeholder: "+905551234567", icon: "📞" },
  { id: "email", label: "E-posta", placeholder: "ornek@email.com", icon: "✉️" },
  { id: "text", label: "Metin", placeholder: "QR kodunuzun içeriği...", icon: "📝" },
  { id: "whatsapp", label: "WhatsApp", placeholder: "+905551234567", icon: "💬" },
];

function buildQRContent(type: QRType, value: string, subject?: string, body?: string): string {
  switch (type) {
    case "url": return value;
    case "phone": return `tel:${value}`;
    case "email": {
      let mailto = `mailto:${value}`;
      const params: string[] = [];
      if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
      if (body) params.push(`body=${encodeURIComponent(body)}`);
      if (params.length) mailto += "?" + params.join("&");
      return mailto;
    }
    case "text": return value;
    case "whatsapp": {
      const phone = value.replace(/\D/g, "");
      return `https://wa.me/${phone}`;
    }
    default: return value;
  }
}

export default function QRGenerator() {
  const { isAuthenticated, loading } = useAuth();
  const [qrType, setQrType] = useState<QRType>("url");
  const [value, setValue] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateQR = async (content: string) => {
    if (!content.trim()) {
      setQrDataUrl(null);
      return;
    }
    setIsGenerating(true);
    try {
      const QRCode = (await import("qrcode")).default;
      const dataUrl = await QRCode.toDataURL(content, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error("QR generation error:", err);
      toast.error("QR kod oluşturulamadı");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const content = buildQRContent(qrType, value, emailSubject, emailBody);
      generateQR(content);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [qrType, value, emailSubject, emailBody]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `llinktr-qr-${qrType}-${Date.now()}.png`;
    link.click();
    toast.success("QR kod indirildi!");
  };

  const currentType = QR_TYPES.find(t => t.id === qrType)!;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-400/10 mb-4">
              <QrCode className="h-7 w-7 text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold mb-3">QR Kod Oluşturucu</h1>
            <p className="text-muted-foreground">URL, telefon, e-posta, metin ve WhatsApp için QR kodlar oluşturun.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
            {/* Left: Form */}
            <div className="space-y-5">
              {/* Type selector */}
              <div className="p-5 rounded-2xl bg-card border border-border/50">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-3 block">
                  QR Kod Tipi
                </Label>
                <div className="grid grid-cols-5 gap-2">
                  {QR_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => { setQrType(type.id); setValue(""); }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                        qrType === type.id
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border/50 hover:border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="text-xl">{type.icon}</span>
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input fields */}
              <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    {currentType.label} {qrType === "whatsapp" ? "Numarası" : qrType === "phone" ? "Numarası" : ""}
                  </Label>
                  {qrType === "text" ? (
                    <Textarea
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={currentType.placeholder}
                      className="bg-input border-border/50 focus:border-primary resize-none"
                      rows={4}
                    />
                  ) : (
                    <Input
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={currentType.placeholder}
                      className="bg-input border-border/50 focus:border-primary"
                      type={qrType === "email" ? "email" : qrType === "phone" || qrType === "whatsapp" ? "tel" : "text"}
                    />
                  )}
                </div>

                {qrType === "email" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Konu (opsiyonel)</Label>
                      <Input
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="E-posta konusu"
                        className="bg-input border-border/50 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mesaj (opsiyonel)</Label>
                      <Textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="E-posta içeriği..."
                        className="bg-input border-border/50 focus:border-primary resize-none"
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {/* Content preview */}
                {value && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">QR İçeriği:</p>
                    <p className="text-xs font-mono break-all text-foreground/80">
                      {buildQRContent(qrType, value, emailSubject, emailBody)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: QR Preview */}
            <div className="flex flex-col items-center">
              <div className="sticky top-24 w-full">
                <div className="p-6 rounded-2xl bg-card border border-border/50 flex flex-col items-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-semibold">Önizleme</p>

                  <div className="w-[220px] h-[220px] rounded-xl bg-white flex items-center justify-center border border-border/30 overflow-hidden">
                    {isGenerating ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="text-center p-4">
                        <QrCode className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">İçerik girin</p>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleDownload}
                    disabled={!qrDataUrl || isGenerating}
                    className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_oklch(0.93_0.23_110/0.25)]"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PNG İndir
                  </Button>

                  {qrDataUrl && (
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      300×300px, yüksek kalite
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
