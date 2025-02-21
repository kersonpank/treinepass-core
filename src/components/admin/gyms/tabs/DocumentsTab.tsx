
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Eye, Trash2, XCircle, RotateCcw } from "lucide-react";
import type { GymDocument } from "@/types/gym";

interface DocumentsTabProps {
  documents?: GymDocument[];
  onDocumentStatusChange: (docId: string, newStatus: string) => void;
  onRestoreDocument: (docId: string) => void;
  onDeleteDocument: (docId: string) => void;
}

export function DocumentsTab({ 
  documents,
  onDocumentStatusChange,
  onRestoreDocument,
  onDeleteDocument,
}: DocumentsTabProps) {
  const getDocumentUrl = (path: string) => {
    if (path?.startsWith('http')) return path;
    return `https://jlzkwcgzpfrdgcdjmjao.supabase.co/storage/v1/object/public/academy-images/${path}`;
  };

  return (
    <>
      {documents?.length ? (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`flex items-start justify-between p-4 border rounded-lg ${
                doc.deleted_by_gym ? 'bg-gray-50' : ''
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{doc.tipo}</h4>
                  {doc.deleted_by_gym && (
                    <Badge variant="outline" className="text-gray-500">
                      Excluído pela academia
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{doc.nome}</p>
                {doc.observacoes && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    {doc.observacoes}
                  </p>
                )}
                {doc.deleted_at && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Excluído em: {new Date(doc.deleted_at).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!doc.deleted_by_gym && doc.status === "pendente" && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDocumentStatusChange(doc.id, "aprovado")}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDocumentStatusChange(doc.id, "rejeitado")}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </>
                )}
                <Badge
                  variant={
                    doc.status === "aprovado"
                      ? "default"
                      : doc.status === "rejeitado"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {doc.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(getDocumentUrl(doc.caminho), "_blank")}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Visualizar
                </Button>
                {doc.deleted_by_gym ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRestoreDocument(doc.id)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restaurar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteDocument(doc.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Nenhum documento enviado</p>
      )}
    </>
  );
}
