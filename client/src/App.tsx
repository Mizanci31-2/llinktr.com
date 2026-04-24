import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Shortener from "./pages/Shortener";
import QRGenerator from "./pages/QRGenerator";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import CookiePolicy from "./pages/CookiePolicy";
import Kvkk from "./pages/Kvkk";
import BioBuilder from "./pages/BioBuilder";
import PublicBioPage from "./pages/PublicBioPage";
import PublicProfile from "./pages/PublicProfile";
import Login from "./pages/Login";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/giris" component={Login} />
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
      <Route path="/404" component={NotFound} />
      {/* Public profile pages - must be last, catches /:username */}
      <Route path="/:username" component={PublicProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
