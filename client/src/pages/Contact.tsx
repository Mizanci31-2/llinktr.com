import { useState, type FormEvent } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Instagram, Loader2, Mail, MessageSquare, Send } from "lucide-react";

const faqs = [
  {
    q: "Hesabımı nasıl silebilirim?",
    a: "Hesap silme talebinizi e-posta veya iletişim formu üzerinden bize iletebilirsiniz. Talebiniz doğrulandıktan sonra gerekli işlem başlatılır.",
  },
  {
    q: "Şifremi unuttum, ne yapmalıyım?",
    a: "Giriş ekranındaki şifremi unuttum bağlantısını kullanarak e-posta adresinize şifre yenileme bağlantısı isteyebilirsiniz.",
  },
  {
    q: "Destek ekibi ne kadar sürede dönüş yapar?",
    a: "Destek taleplerine mümkün olan en kısa sürede dönüş yapılır. Talebin içeriğine göre yanıt süresi değişebilir.",
  },
];

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Lütfen ad, e-posta ve mesaj alanlarını doldurun.");
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
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Form gönderilemedi.");

      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      toast.success("Mesajınız alındı. En kısa sürede dönüş yapacağız.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Form gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container flex-1 py-12">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">İletişim</p>
          <h1 className="mb-4 text-3xl font-bold md:text-5xl">Bizimle iletişime geçin</h1>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            Destek, öneri, hesap işlemleri veya iş birliği taleplerinizi form üzerinden iletin. Mesajlar admin paneline düşer.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(360px,1fr)]">
          <section className="rounded-[18px] border border-white/10 bg-card p-6 shadow-2xl">
            <h2 className="text-2xl font-semibold">İletişim bilgileri</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Formu doldurabilir, e-posta gönderebilir veya Instagram üzerinden bize ulaşabilirsiniz.
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
                  <span className="mt-1 block text-sm text-muted-foreground">Teknik sorunları ve hesap taleplerini açık şekilde yazmanız süreci hızlandırır.</span>
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

          <section className="rounded-[18px] border border-white/10 bg-card p-6 shadow-2xl">
            <h2 className="text-2xl font-semibold">Mesaj gönder</h2>
            <p className="mt-2 text-sm text-muted-foreground">Formu gönderdiğinizde talebiniz admin panelinden görüntülenebilir.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Adınız</Label>
                  <Input id="contact-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ad Soyad" maxLength={80} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">E-posta</Label>
                  <Input id="contact-email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="ornek@mail.com" maxLength={120} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-subject">Konu</Label>
                <Input id="contact-subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Destek talebi" maxLength={120} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">Mesajınız</Label>
                <Textarea id="contact-message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Nasıl yardımcı olabiliriz?" rows={7} maxLength={2000} />
              </div>

              <Button type="submit" disabled={submitting} className="h-11 w-full bg-primary font-bold text-primary-foreground">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Gönder
              </Button>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
