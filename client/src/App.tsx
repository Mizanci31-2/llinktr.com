import { lazy, Suspense, useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePathname, useRouter } from "next/navigation";
import { Switch, Route, useLocation, useParams } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SeoManager } from "@/components/SeoManager";

function AppLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-background text-foreground">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

const Home = lazy(() => import("./pages/home/Home"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));
const Login = lazy(() => import("./pages/auth/Login"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const BioBuilder = lazy(() => import("./pages/bio-builder/BioBuilder"));
const Shortener = lazy(() => import("./pages/tools/Shortener"));
const QRGenerator = lazy(() => import("./pages/tools/QRGenerator"));
const About = lazy(() => import("./pages/marketing/About"));
const Contact = lazy(() => import("./pages/marketing/Contact"));
const FeatureLanding = lazy(() => import("./pages/marketing/FeatureLanding"));
const Blog = lazy(() => import("./pages/marketing/Blog"));
const BlogArticle = lazy(() => import("./pages/marketing/BlogArticle"));
const SeoLanding = lazy(() => import("./pages/marketing/SeoLanding"));
const HelpCenter = lazy(() => import("./pages/marketing/HelpCenter"));
const HelpTopicPage = lazy(() => import("./pages/marketing/HelpTopicPage"));
const PolicyPage = lazy(() => import("./pages/legal/PolicyPage"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy"));
const Kvkk = lazy(() => import("./pages/legal/Kvkk"));
const PublicBioPage = lazy(() => import("./pages/public-bio/PublicBioPage"));
const PublicProfile = lazy(() => import("./pages/public-profile/PublicProfile"));
const LegacyPublicRoute = lazy(() => import("./pages/public-route/LegacyPublicRoute"));
const NotFound = lazy(() => import("./pages/system/NotFound"));

const BioEditorPage = () => <FeatureLanding kind="bio" />;
const LinkShortenerPage = () => <FeatureLanding kind="shortener" />;
const QrCreatorPage = () => <FeatureLanding kind="qr" />;
const InstagramBioLanding = () => <SeoLanding kind="instagram" />;
const LinktreeAlternativeLanding = () => <SeoLanding kind="linktree" />;
const FreeLinkPageLanding = () => <SeoLanding kind="free" />;
const BioLinkCreatorLanding = () => <SeoLanding kind="creator" />;
const CommunityGuidelinesPage = () => <PolicyPage kind="community" />;
const ReportPage = () => <PolicyPage kind="report" />;

function AdminRedirect() {
  if (typeof window !== "undefined") {
    window.location.replace("/admin31");
  }

  return null;
}

function PublicBioRoute() {
  return <PublicBioPage />;
}

function PublicProfileRoute() {
  return <PublicProfile />;
}

function LegacyPublicRouteWrapper() {
  return <LegacyPublicRoute />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/giris" component={Login} />
      <Route path="/hesap" component={Login} />
      <Route path="/kayit" component={Login} />
      <Route path="/kayitol" component={Login} />
      <Route path="/register" component={Login} />
      <Route path="/admin" component={AdminRedirect} />
      <Route path="/admin31" component={AdminPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/:id" component={BioBuilder} />
      <Route path="/builder/:id" component={BioBuilder} />
      <Route path="/shortener" component={Shortener} />
      <Route path="/qr" component={QRGenerator} />
      <Route path="/bio-duzenleyici" component={BioEditorPage} />
      <Route path="/link-kisaltici" component={LinkShortenerPage} />
      <Route path="/qr-olusturucu" component={QrCreatorPage} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogArticle} />
      <Route path="/instagram-bio-linki" component={InstagramBioLanding} />
      <Route path="/linktree-alternatifi" component={LinktreeAlternativeLanding} />
      <Route path="/ucretsiz-link-sayfasi" component={FreeLinkPageLanding} />
      <Route path="/bio-link-olusturucu" component={BioLinkCreatorLanding} />
      <Route path="/hakkimizda" component={About} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/cookies" component={CookiePolicy} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      <Route path="/kvkk" component={Kvkk} />
      <Route path="/topluluk-kurallari" component={CommunityGuidelinesPage} />
      <Route path="/yardim-merkezi/kategori/:slug" component={HelpTopicPage} />
      <Route path="/yardim-merkezi/:articleId" component={HelpTopicPage} />
      <Route path="/yardim-merkezi" component={HelpCenter} />
      <Route path="/report" component={ReportPage} />
      <Route path="/raporla" component={ReportPage} />
      <Route path="/404" component={NotFound} />
      <Route path="/p/:slug" component={PublicBioRoute} />
      <Route path="/u/:username" component={PublicProfileRoute} />
      <Route path="/:slug" component={LegacyPublicRouteWrapper} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ScrollManager() {
  const [location] = useLocation();
  const previousLocationRef = useRef(location);
  const isPopNavigationRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => {
      isPopNavigationRef.current = true;
    };
    window.history.scrollRestoration = "auto";
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (previousLocationRef.current === location) return;
    previousLocationRef.current = location;

    if (isPopNavigationRef.current) {
      isPopNavigationRef.current = false;
      return;
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, [location]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <SeoManager />
          <ScrollManager />
          <Suspense fallback={<AppLoading />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
