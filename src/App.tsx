import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "./pages/Index";
import CadastroAcademia from "./pages/CadastroAcademia";
import CadastroPessoaFisica from "./pages/CadastroPessoaFisica";
import CadastroEmpresa from "./pages/CadastroEmpresa";
import DashboardEmpresa from "./pages/DashboardEmpresa";
import AppMobile from "./pages/AppMobile";
import AcademiaPanel from "./pages/AcademiaPanel";
import SelecionarPerfil from "./pages/SelecionarPerfil";
import { Toaster } from "./components/ui/toaster";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/cadastro-academia" element={<CadastroAcademia />} />
          <Route path="/cadastro-pessoa-fisica" element={<CadastroPessoaFisica />} />
          <Route path="/cadastro-empresa" element={<CadastroEmpresa />} />
          <Route path="/dashboard-empresa" element={<DashboardEmpresa />} />
          <Route path="/app" element={<AppMobile />} />
          <Route path="/academia/:id" element={<AcademiaPanel />} />
          <Route path="/selecionar-perfil" element={<SelecionarPerfil />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;