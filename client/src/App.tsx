import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import BioBuilder from "./pages/BioBuilder";
import Shortener from "./pages/Shortener";
import QRGenerator from "./pages/QRGenerator";
import PublicBioPage from "./pages/PublicBioPage";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Terms from "./pages/Terms";
import CookiePolicy from "./pages/CookiePolicy";
import Kvkk from "./pages/Kvkk";
import Login from "./pages/Login";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/giris" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/builder/:id" component={BioBuilder} />
      <Route path="/shortener" component={Shortener} />
      <Route path="/qr" component={QRGenerator} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/cookies" component={CookiePolicy} />
      <Route path="/kvkk" component={Kvkk} />
      <Route path="/contact" component={Contact} />
      <Route path="/about" component={About} />
      {/* Public bio pages - must be last, catches /:slug */}
      <Route path="/p/:slug" component={PublicBioPage} />
      <Route path="/:slug" component={PublicBioPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
