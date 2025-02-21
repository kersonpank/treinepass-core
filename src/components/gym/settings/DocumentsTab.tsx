
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

interface DocumentsTabProps {
  academiaId: string;
}

export function DocumentsTab({ academiaId }: DocumentsTabProps) {
  const { data: documents } = useQuery({
    queryKey: ["academia-documents", academiaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academia_documentos")
        .select("*")
        .eq("academia_id", academiaId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprovado":
        return "default";
      case "rejeitado":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getDocumentUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/academy-images/${path}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents?.length ? (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-start gap-4">
                  <FileText className="h-5 w-5 mt-1 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">{doc.tipo}</h4>
                    <p className="text-sm text-muted-foreground">{doc.nome}</p>
                    {doc.observacoes && (
                      <p className="text-sm mt-1 text-muted-foreground">
                        {doc.observacoes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(doc.status)}>
                    {doc.status}
                  </Badge>
                  <a
                    href={getDocumentUrl(doc.caminho)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Visualizar
                  </a>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">
              Nenhum documento enviado
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
