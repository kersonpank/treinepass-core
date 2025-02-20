
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Eye, Trash2, XCircle, RotateCcw } from "lucide-react";
import type { Gym, GymDocument } from "@/types/gym";

interface GymDetailsContentProps {
  gym: Gym;
  documents?: GymDocument[];
  onDocumentStatusChange: (docId: string, newStatus: string) => void;
  onRestoreDocument: (docId: string) => void;
  onDeleteDocument: (docId: string) => void;
  getImageUrl: (path: string) => string;
}

export function GymDetailsContent({ 
  gym, 
  documents,
  onDocumentStatusChange,
  onRestoreDocument,
  onDeleteDocument,
  getImageUrl,
}: GymDetailsContentProps) {
  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="info">Informações</TabsTrigger>
        <TabsTrigger value="photos">Fotos</TabsTrigger>
        <TabsTrigger value="schedule">Horários</TabsTrigger>
        <TabsTrigger value="modalities">Modalidades</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="space-y-4">
        <div>
          <h4 className="font-semibold">Nome</h4>
          <p>{gym.nome}</p>
        </div>
        <div>
          <h4 className="font-semibold">CNPJ</h4>
          <p>{gym.cnpj}</p>
        </div>
        <div>
          <h4 className="font-semibold">Email</h4>
          <p>{gym.email}</p>
        </div>
        <div>
          <h4 className="font-semibold">Telefone</h4>
          <p>{gym.telefone || "-"}</p>
        </div>
        <div>
          <h4 className="font-semibold">Endereço</h4>
          <p>{gym.endereco || "-"}</p>
        </div>
      </TabsContent>

      <TabsContent value="photos" className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {gym.fotos?.map((foto, index) => (
            <div key={index} className="relative aspect-square">
              <img
                src={getImageUrl(foto)}
                alt={`Foto ${index + 1}`}
                className="rounded-lg object-cover w-full h-full"
              />
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="schedule">
        {gym.horario_funcionamento ? (
          <div className="space-y-2">
            {Object.entries(gym.horario_funcionamento).map(([dia, horario]: [string, any]) => (
              <div key={dia} className="flex justify-between">
                <span className="font-semibold capitalize">{dia}</span>
                <span>{horario.abertura} - {horario.fechamento}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhum horário cadastrado</p>
        )}
      </TabsContent>

      <TabsContent value="modalities">
        {gym.academia_modalidades?.length ? (
          <div className="flex flex-wrap gap-2">
            {gym.academia_modalidades.map((am, index) => (
              <Badge key={index} variant="secondary">
                {am.modalidade.nome}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhuma modalidade cadastrada</p>
        )}
      </TabsContent>

      <TabsContent value="documents" className="space-y-4">
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
                    onClick={() => window.open(getImageUrl(doc.caminho), "_blank")}
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
      </TabsContent>
    </Tabs>
  );
}
