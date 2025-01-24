import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Academia = Tables<"academias">;

interface OverviewPanelProps {
  academia: Academia;
}

export function OverviewPanel({ academia }: OverviewPanelProps) {
  return (
    <div className="space-y-4">
      {academia.status === "pendente" && (
        <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-600">Academia Pendente</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Sua academia está em análise. Aguarde a aprovação do administrador para começar a utilizar o sistema.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">CNPJ</h3>
              <p>{academia.cnpj}</p>
            </div>
            <div>
              <h3 className="font-medium">Email</h3>
              <p>{academia.email}</p>
            </div>
            <div>
              <h3 className="font-medium">Telefone</h3>
              <p>{academia.telefone}</p>
            </div>
            <div>
              <h3 className="font-medium">Endereço</h3>
              <p>{academia.endereco}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}