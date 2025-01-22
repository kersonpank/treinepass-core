import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Academia = Tables<"academias">;

interface OverviewPanelProps {
  academia: Academia;
}

export function OverviewPanel({ academia }: OverviewPanelProps) {
  const { data: modalidades } = useQuery({
    queryKey: ["academia_modalidades", academia.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academia_modalidades")
        .select(`
          modalidade:modalidades (
            nome
          )
        `)
        .eq("academia_id", academia.id);

      if (error) throw error;
      return data;
    },
  });

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
              {modalidades?.map((modalidade, index) => (
                <span
                  key={index}
                  className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm"
                >
                  {modalidade.modalidade.nome}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}