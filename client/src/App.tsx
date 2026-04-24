import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import PublicProfile from "./pages/PublicProfile";
import Login from "./pages/Login";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/giris" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      {/* Public profile pages - must be last, catches /:username */}
      <Route path="/:username" component={PublicProfile} />
      <Route path="/404" component={NotFound} />
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
