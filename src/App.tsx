import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { DesktopLayout } from "@/components/DesktopLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Animais from "./pages/Animais";
import AnimalForm from "./pages/AnimalForm";
import Tarefas from "./pages/Tarefas";
import ProducaoLeite from "./pages/ProducaoLeite";
import Cooperativa from "./pages/Cooperativa";
import Reproducao from "./pages/Reproducao";
import ProtocolosIATF from "./pages/ProtocolosIATF";
import Financeiro from "./pages/Financeiro";
import Vacinacao from "./pages/Vacinacao";
import Tratamentos from "./pages/Tratamentos";
import Estoque from "./pages/Estoque";
import PlantioSilo from "./pages/PlantioSilo";
import Equipamentos from "./pages/Equipamentos";
import Pesagens from "./pages/Pesagens";
import Lotes from "./pages/Lotes";
import MapaFazenda from "./pages/MapaFazenda";
import CalendarioVacinas from "./pages/CalendarioVacinas";
import UsuariosPage from "./pages/Usuarios";
import PendenciasImportacao from "./pages/PendenciasImportacao";
import Configuracoes from "./pages/Configuracoes";
import VendasAvulsas from "./pages/VendasAvulsas";
import Nutricao from "./pages/Nutricao";
import AnimalProfile from "./pages/AnimalProfile";
import IdentificarAnimal from "./pages/IdentificarAnimal";
import Enfermaria from "./pages/Enfermaria";
import NotFound from "./pages/NotFound";
import GestaoSocios from "./pages/GestaoSocios";
import ModuleOverview from "./pages/ModuleOverview";
import { RouteTransition } from "@/components/RouteTransition";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function DesktopRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DesktopLayout>{children}</DesktopLayout>
    </ProtectedRoute>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />

      {/* Desktop routes */}
      <Route path="/dashboard" element={<DesktopRoute><Dashboard /></DesktopRoute>} />
      <Route path="/modulos" element={<DesktopRoute><ModuleOverview /></DesktopRoute>} />
      <Route path="/modulos/:moduleId" element={<DesktopRoute><ModuleOverview /></DesktopRoute>} />
      <Route path="/animais" element={<DesktopRoute><Animais /></DesktopRoute>} />
      <Route path="/animais/novo" element={<DesktopRoute><AnimalForm /></DesktopRoute>} />
      <Route path="/identificar" element={<DesktopRoute><IdentificarAnimal /></DesktopRoute>} />
      <Route path="/animais/:id/perfil" element={<DesktopRoute><AnimalProfile /></DesktopRoute>} />
      <Route path="/animais/:id" element={<DesktopRoute><AnimalForm /></DesktopRoute>} />
      <Route path="/tarefas" element={<DesktopRoute><Tarefas /></DesktopRoute>} />
      <Route path="/pesagens" element={<DesktopRoute><Pesagens /></DesktopRoute>} />
      <Route path="/lotes" element={<DesktopRoute><Lotes /></DesktopRoute>} />
      <Route path="/mapa" element={<DesktopRoute><MapaFazenda /></DesktopRoute>} />
      <Route path="/calendario-vacinas" element={<DesktopRoute><CalendarioVacinas /></DesktopRoute>} />
      <Route path="/reproducao" element={<DesktopRoute><Reproducao /></DesktopRoute>} />
      <Route path="/reproducao/:tab" element={<DesktopRoute><Reproducao /></DesktopRoute>} />
      <Route path="/protocolos-iatf" element={<DesktopRoute><ProtocolosIATF /></DesktopRoute>} />
      <Route path="/producao-leite" element={<DesktopRoute><ProducaoLeite /></DesktopRoute>} />
      <Route path="/cooperativa" element={<DesktopRoute><Cooperativa /></DesktopRoute>} />
      <Route path="/vacinacao" element={<DesktopRoute><Vacinacao /></DesktopRoute>} />
      <Route path="/tratamentos" element={<DesktopRoute><Tratamentos /></DesktopRoute>} />
      <Route path="/enfermaria" element={<DesktopRoute><Enfermaria /></DesktopRoute>} />
      <Route path="/nutricao" element={<DesktopRoute><Nutricao /></DesktopRoute>} />
      <Route path="/plantio-silo" element={<DesktopRoute><PlantioSilo /></DesktopRoute>} />
      <Route path="/estoque" element={<DesktopRoute><Estoque /></DesktopRoute>} />
      <Route path="/equipamentos" element={<DesktopRoute><Equipamentos /></DesktopRoute>} />
      <Route path="/financeiro" element={<DesktopRoute><Financeiro /></DesktopRoute>} />
      <Route path="/vendas-avulsas" element={<DesktopRoute><VendasAvulsas /></DesktopRoute>} />
      <Route path="/gestao-socios" element={<DesktopRoute><GestaoSocios /></DesktopRoute>} />
      <Route path="/usuarios" element={<DesktopRoute><UsuariosPage /></DesktopRoute>} />
      <Route path="/pendencias-importacao" element={<DesktopRoute><PendenciasImportacao /></DesktopRoute>} />
      <Route path="/configuracoes" element={<DesktopRoute><Configuracoes /></DesktopRoute>} />

      {/* Mobile routes */}
      <Route path="/mobile" element={<Navigate to="/dashboard" replace />} />
      <Route path="/mobile/tarefas" element={<Navigate to="/tarefas" replace />} />
      <Route path="/mobile/rebanho" element={<Navigate to="/animais" replace />} />
      <Route path="/mobile/registros" element={<Navigate to="/producao-leite" replace />} />
      <Route path="/mobile/mais" element={<Navigate to="/modulos" replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <RouteTransition />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
