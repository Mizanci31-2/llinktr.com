import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import MondiadNativeAd from "@/components/MondiadNativeAd";

function AppLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-background text-foreground">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

const Home = lazy(() => import("./pages/Home"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const BioBuilder = lazy(() => import("./pages/BioBuilder"));
const Shortener = lazy(() => import("./pages/Shortener"));
const QRGenerator = lazy(() => import("./pages/QRGenerator"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const Kvkk = lazy(() => import("./pages/Kvkk"));
const PublicBioPage = lazy(() => import("./pages/PublicBioPage"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));

function AdminRedirect() {
  if (typeof window !== "undefined") {
    window.location.replace("/admin31");
  }

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/giris" component={Login} />
      <Route path="/kayitol" component={Login} />
      <Route path="/register" component={Login} />
      <Route path="/admin" component={AdminRedirect} />
      <Route path="/admin31" component={AdminPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/:id" component={BioBuilder} />
      <Route path="/builder/:id" component={BioBuilder} />
      <Route path="/shortener" component={Shortener} />
      <Route path="/qr" component={QRGenerator} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/cookies" component={CookiePolicy} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      <Route path="/kvkk" component={Kvkk} />
      <Route path="/p/:slug" component={PublicBioPage} />
      <Route path="/u/:username" component={PublicProfile} />
      <Route path="/:slug" component={PublicBioPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function shouldShowGlobalNativeAd() {
  if (typeof window === "undefined") return true;
  return !/(checkout|payment|billing|odeme|ödeme|abonelik|subscription|plans?|pricing)/i.test(window.location.pathname);
}

function App() {
  const showGlobalNativeAd = shouldShowGlobalNativeAd();

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          {showGlobalNativeAd ? <MondiadNativeAd compact className="border-b border-white/5 bg-[#07090c] py-1.5" /> : null}
          <Suspense fallback={<AppLoading />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
