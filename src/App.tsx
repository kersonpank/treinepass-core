import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SelecionarPerfil from "./pages/SelecionarPerfil";
import CadastroAcademia from "./pages/CadastroAcademia";
import CadastroPessoaFisica from "./pages/CadastroPessoaFisica";
import CadastroEmpresa from "./pages/CadastroEmpresa";
import CadastroEmpresaEndereco from "./pages/CadastroEmpresaEndereco";
import DashboardEmpresa from "./pages/DashboardEmpresa";
import AcademiaPanel from "./pages/AcademiaPanel";
import AppMobile from "./pages/AppMobile";
import { Toaster } from "@/components/ui/toaster";
import "./App.css";

function App() {
  return (
    <Router>
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
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;