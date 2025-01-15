import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            TreinePass
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Conectando pessoas a academias de qualidade
          </p>
          <div className="space-y-4">
            <Button
              onClick={() => navigate("/cadastro-academia")}
              className="w-full md:w-auto bg-[#0125F0] hover:bg-blue-700 text-white"
            >
              Cadastrar Academia
            </Button>
            <Button
              onClick={() => navigate("/cadastro-empresa")}
              className="w-full md:w-auto bg-[#0125F0] hover:bg-blue-700 text-white ml-0 md:ml-4"
            >
              Cadastrar Empresa
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}