import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";

type Academia = Tables<"academias">;

interface OverviewPanelProps {
  academia: Academia;
}

export function OverviewPanel({ academia }: OverviewPanelProps) {
  return (
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
            <h3 className="font-medium">Modalidades</h3>
            <div className="flex flex-wrap gap-2">
              {academia.modalidades.map((modalidade: string) => (
                <span
                  key={modalidade}
                  className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm"
                >
                  {modalidade}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}