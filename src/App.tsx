
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Index from "./pages/Index";
import SelecionarPerfil from "./pages/SelecionarPerfil";
import CadastroAcademia from "./pages/CadastroAcademia";
import CadastroPessoaFisica from "./pages/CadastroPessoaFisica";
import CadastroEmpresa from "./pages/CadastroEmpresa";
import CadastroEmpresaEndereco from "./pages/CadastroEmpresaEndereco";
import DashboardEmpresa from "./pages/DashboardEmpresa";
import AcademiaPanel from "./pages/AcademiaPanel";
import AppMobile from "./pages/AppMobile";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import { AdminProvider } from "./contexts/AdminContext";
import { Toaster } from "@/components/ui/toaster";
import PaymentStatus from "./pages/PaymentStatus";
import "./App.css";

const BackButton = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/') return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="fixed top-4 left-4 z-50"
      onClick={() => navigate('/')}
    >
      <Home className="mr-2 h-4 w-4" />
      Início
    </Button>
  );
};

function App() {
  return (
    <AdminProvider>
      <Router>
        <BackButton />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/selecionar-perfil" element={<SelecionarPerfil />} />
          <Route path="/cadastro-academia" element={<CadastroAcademia />} />
          <Route path="/cadastro-pessoa-fisica" element={<CadastroPessoaFisica />} />
          <Route path="/cadastro-empresa" element={<CadastroEmpresa />} />
          <Route path="/cadastro-empresa/endereco" element={<CadastroEmpresaEndereco />} />
          <Route path="/dashboard-empresa" element={<DashboardEmpresa />} />
          <Route path="/academia/:id" element={<AcademiaPanel />} />
          <Route path="/app/*" element={<AppMobile />} />
          <Route path="/loginadmin" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
          </Route>
          {/* Rotas de pagamento */}
          <Route path="/payment/success" element={<PaymentStatus />} />
          <Route path="/payment/failure" element={<PaymentStatus />} />
        </Routes>
        <Toaster />
      </Router>
    </AdminProvider>
  );
}

export default App;
