import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppLayout } from "@/components/layout";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import PresencaPage from "@/pages/presenca";
import CriancasPage from "@/pages/criancas";
import ChildProfilePage from "@/pages/criancas/profile";
import ChildFormPage from "@/pages/criancas/form";
import CongregacoesPage from "@/pages/congregacoes";
import HistoricoPage from "@/pages/historico";
import RelatoriosPage from "@/pages/relatorios";
import LixeiraPage from "@/pages/lixeira";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// A simple wrapper to apply layout to protected routes
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={() => <LoginPage />} />
      <Route path="/admin-login" component={() => <LoginPage adminPortal />} />
      
      {/* Protected Routes */}
      <Route path="/" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/presenca" component={() => <ProtectedRoute component={PresencaPage} />} />
      <Route path="/criancas" component={() => <ProtectedRoute component={CriancasPage} />} />
      <Route path="/criancas/nova" component={() => <ProtectedRoute component={ChildFormPage} />} />
      <Route path="/criancas/:id" component={() => <ProtectedRoute component={ChildProfilePage} />} />
      <Route path="/criancas/:id/editar" component={() => <ProtectedRoute component={ChildFormPage} />} />
      <Route path="/congregacoes" component={() => <ProtectedRoute component={CongregacoesPage} />} />
      <Route path="/historico" component={() => <ProtectedRoute component={HistoricoPage} />} />
      <Route path="/relatorios" component={() => <ProtectedRoute component={RelatoriosPage} />} />
      <Route path="/lixeira" component={() => <ProtectedRoute component={LixeiraPage} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
