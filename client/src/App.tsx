import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Create from "./pages/Create";
import Status from "./pages/Status";
import QuickTest from "./pages/QuickTest";
import TestE2E from "./pages/TestE2E";

import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/create"} component={Create} />
      <Route path={"/status/:jobId"} component={Status} />
      <Route path={"/quick-test"} component={QuickTest} />
      <Route path={"/test-e2e"} component={TestE2E} />

      <Route path={"/termos"} component={Terms} />
      <Route path={"/privacidade"} component={Privacy} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
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
