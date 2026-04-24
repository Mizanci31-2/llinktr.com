import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, MessageSquare, Globe } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 container py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">İletişim</h1>
        <p className="text-muted-foreground mb-10">Sorularınız ve geri bildirimleriniz için bizimle iletişime geçin.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-card border border-border/50 flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">E-posta</p>
              <p className="text-sm text-muted-foreground mt-1">destekmerkezi31@gmail.com</p>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border/50 flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-blue-400/10 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold">Destek</p>
              <p className="text-sm text-muted-foreground mt-1">7/24 teknik destek</p>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border/50 flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-purple-400/10 flex items-center justify-center">
              <Globe className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="font-semibold">Sosyal Medya</p>
              <p className="text-sm text-muted-foreground mt-1">@llinktr</p>
            </div>
          </div>
        </div>
        <div className="mt-10 p-6 rounded-2xl bg-card border border-border/50">
          <h2 className="text-lg font-semibold mb-4">Sık Sorulan Sorular</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p><span className="text-foreground font-medium">Hesabımı nasıl silebilirim?</span> — Destek ekibimize e-posta göndererek hesap silme talebinde bulunabilirsiniz.</p>
            <p><span className="text-foreground font-medium">Slug'ımı değiştirebilir miyim?</span> — Evet, bio builder içinden slug'ınızı istediğiniz zaman güncelleyebilirsiniz.</p>
            <p><span className="text-foreground font-medium">Kısa linklerim kalıcı mı?</span> — Evet, oluşturduğunuz kısa linkler kalıcı olarak aktif kalır.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
