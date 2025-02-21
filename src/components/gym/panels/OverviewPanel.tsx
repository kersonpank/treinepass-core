
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Academia = Tables<"academias">;

interface OverviewPanelProps {
  academia: Academia;
}

export function OverviewPanel({ academia }: OverviewPanelProps) {
  return (
    <div className="space-y-4">
      {academia.status === "pendente" && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-600">Cadastro em Análise</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Seu cadastro está sendo analisado pela equipe do TreinePass. Em breve você receberá uma resposta.
            Certifique-se de que todos os documentos necessários foram enviados e que as informações estão corretas.
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
            {academia.status === "pendente" && (
              <div>
                <h3 className="font-medium">Status</h3>
                <p className="text-yellow-600">Aguardando Aprovação</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
