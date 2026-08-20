import { useState, type FormEvent } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Instagram, Loader2, Mail, MessageSquare, Send } from "lucide-react";

const faqs = [
  {
    q: "Hesab1m1 nas1l silebilirim?",
    a: "Hesap silme talebinizi e-posta veya ileti_im formu �zerinden bize iletebilirsiniz. Talebiniz doruland1ktan sonra gerekli i_lem ba_lat1l1r.",
  },
  {
    q: "^ifremi unuttum, ne yapmal1y1m?",
    a: "Giri_ ekran1ndaki _ifremi unuttum balant1s1n1 kullanarak e-posta adresinize _ifre yenileme balant1s1 isteyebilirsiniz.",
  },
  {
    q: "Destek ekibi ne kadar s�rede d�n�_ yapar?",
    a: "Destek taleplerine m�mk�n olan en k1sa s�rede d�n�_ yap1l1r. Talebin i�eriine g�re yan1t s�resi dei_ebilir.",
  },
];

const subjectOptions = [
  "Destek talebi",
  "Hesap i_lemleri",
  "^ifremi unuttum",
  "�deme / sat1_",
  "�neri ve geri bildirim",
  "0_ birlii",
  "Dier",
];

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Destek talebi");
  const [customSubject, setCustomSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const finalSubject = subject === "Dier" ? customSubject.trim() : subject;

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("L�tfen ad, e-posta ve mesaj alanlar1n1 doldurun.");
      return;
    }

    if (!finalSubject) {
      toast.error("L�tfen konuyu yaz1n.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/contact-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: finalSubject,
          message: message.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Form g�nderilemedi.");

      setName("");
      setEmail("");
      setSubject("Destek talebi");
      setCustomSubject("");
      setMessage("");
      toast.success("Mesaj1n1z al1nd1. En k1sa s�rede d�n�_ yapaca1z.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Form g�nderilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container flex-1 py-12">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">0leti_im</p>
          <h1 className="mb-4 text-3xl font-bold md:text-5xl">Bizimle ileti_ime ge�in</h1>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            Destek, �neri, hesap i_lemleri veya i_ birlii taleplerinizi form �zerinden iletin. Mesajlar admin paneline d�_er.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(360px,1fr)]">
          <section className="h-full rounded-[18px] border border-white/15 bg-card/95 p-6 shadow-2xl">
            <h2 className="text-2xl font-semibold">0leti_im bilgileri</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Formu doldurabilir, e-posta g�nderebilir veya Instagram �zerinden bize ula_abilirsiniz.
            </p>

            <div className="mt-6 space-y-4">
              <a href="mailto:destekmerkezi31@gmail.com" className="flex gap-4 rounded-2xl border border-border/60 bg-background/50 p-4 transition-colors hover:border-primary/50">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </span>
                <span>
                  <span className="block font-semibold">E-posta</span>
                  <span className="mt-1 block text-sm text-muted-foreground">destekmerkezi31@gmail.com</span>
                </span>
              </a>

              <a href="https://www.instagram.com/llinktr.destek/" target="_blank" rel="noopener noreferrer" className="flex gap-4 rounded-2xl border border-border/60 bg-background/50 p-4 transition-colors hover:border-primary/50">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-400/10">
                  <Instagram className="h-5 w-5 text-pink-300" />
                </span>
                <span>
                  <span className="block font-semibold">Instagram</span>
                  <span className="mt-1 block text-sm text-muted-foreground">@llinktr.destek</span>
                </span>
              </a>

              <div className="flex gap-4 rounded-2xl border border-border/60 bg-background/50 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                  <MessageSquare className="h-5 w-5 text-cyan-300" />
                </span>
                <span>
                  <span className="block font-semibold">Destek</span>
                  <span className="mt-1 block text-sm text-muted-foreground">Teknik sorunlar1 ve hesap taleplerini a�1k _ekilde yazman1z s�reci h1zland1r1r.</span>
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {faqs.map((item) => (
                <div key={item.q} className="rounded-2xl border border-border/50 bg-background/35 p-4">
                  <h3 className="font-semibold">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="h-full self-start rounded-[18px] border border-white/15 bg-card/95 p-6 shadow-2xl">
            <h2 className="text-2xl font-semibold">Mesaj g�nder</h2>
            <p className="mt-2 text-sm text-muted-foreground">Formu g�nderdiinizde talebiniz admin panelinden g�r�nt�lenebilir.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Ad1n1z</Label>
                  <Input id="contact-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ad Soyad" maxLength={80} className="border-white/20 bg-[#151515] text-foreground placeholder:text-muted-foreground/80 focus-visible:border-primary focus-visible:ring-primary/25" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">E-posta</Label>
                  <Input id="contact-email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="ornek@mail.com" maxLength={120} className="border-white/20 bg-[#151515] text-foreground placeholder:text-muted-foreground/80 focus-visible:border-primary focus-visible:ring-primary/25" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-subject">Konu</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger id="contact-subject" className="w-full border-white/20 bg-[#151515] text-foreground focus:border-primary focus:ring-primary/25">
                    <SelectValue placeholder="Konu se�in" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {subject === "Dier" && (
                <div className="space-y-2">
                  <Label htmlFor="contact-custom-subject">Konuyu yaz1n</Label>
                  <Input
                    id="contact-custom-subject"
                    value={customSubject}
                    onChange={(event) => setCustomSubject(event.target.value)}
                    placeholder="K1sa konu ba_l11"
                    maxLength={120}
                    className="border-white/20 bg-[#151515] text-foreground placeholder:text-muted-foreground/80 focus-visible:border-primary focus-visible:ring-primary/25"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="contact-message">Mesaj1n1z</Label>
                <Textarea id="contact-message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Nas1l yard1mc1 olabiliriz?" rows={7} maxLength={2000} className="min-h-[178px] border-white/20 bg-[#151515] text-foreground placeholder:text-muted-foreground/80 focus-visible:border-primary focus-visible:ring-primary/25" />
              </div>

              <Button type="submit" disabled={submitting} className="h-11 w-full bg-primary font-bold text-primary-foreground">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                G�nder
              </Button>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
