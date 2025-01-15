import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CadastroAcademia from "./pages/CadastroAcademia";
import CadastroPessoaFisica from "./pages/CadastroPessoaFisica";
import CadastroEmpresa from "./pages/CadastroEmpresa";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/cadastro-academia" element={<CadastroAcademia />} />
        <Route path="/cadastro-pessoa-fisica" element={<CadastroPessoaFisica />} />
        <Route path="/cadastro-empresa" element={<CadastroEmpresa />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;