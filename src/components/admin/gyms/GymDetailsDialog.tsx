
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Gym } from "./types/gym";
import { CheckCircle2, Download, Eye, XCircle } from "lucide-react";

interface GymDetailsDialogProps {
  gym: Gym | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (gymId: string, newStatus: string) => void;
}

export function GymDetailsDialog({
  gym,
  open,
  onOpenChange,
  onStatusChange
}: GymDetailsDialogProps) {
  const [selectedTab, setSelectedTab] = useState("info");
  const { toast } = useToast();

  if (!gym) return null;

  const downloadDocument = async (docPath: string, docName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('academy-documents')
        .download(docPath);

      if (error) throw error;

      // Criar um link temporário para download
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = docName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao baixar documento",
        description: error.message
      });
    }
  };

  const getImageUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return `https://jlzkwcgzpfrdgcdjmjao.supabase.co/storage/v1/object/public/academy-images/${path}`;
  };

  const updateDocumentStatus = async (docId: string, newStatus: string, observacoes?: string) => {
    try {
      const { error } = await supabase
        .from('academia_documentos')
        .update({ 
          status: newStatus,
          observacoes,
          revisado_por: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', docId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Status do documento atualizado"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status",
        description: error.message
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {gym.nome}
            <Badge variant={gym.status === "ativo" ? "default" : "secondary"}>
              {gym.status === "ativo" ? "Ativo" : "Pendente"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="photos">Fotos</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">CNPJ</h3>
                <p className="text-muted-foreground">{gym.cnpj}</p>
              </div>
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-muted-foreground">{gym.email}</p>
              </div>
              <div>
                <h3 className="font-medium">Telefone</h3>
                <p className="text-muted-foreground">{gym.telefone || "-"}</p>
              </div>
              <div>
                <h3 className="font-medium">Endereço</h3>
                <p className="text-muted-foreground">{gym.endereco || "-"}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Modalidades</h3>
              <div className="flex flex-wrap gap-2">
                {gym.modalidades?.map((modalidade, index) => (
                  <Badge key={index} variant="secondary">
                    {modalidade}
                  </Badge>
                ))}
              </div>
            </div>

            {gym.status === "pendente" && (
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => onStatusChange(gym.id, "ativo")}
                  className="w-full"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Aprovar Academia
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onStatusChange(gym.id, "rejeitado")}
                  className="w-full"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar Academia
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gym.documentos?.map((doc: any, index) => (
                  <TableRow key={index}>
                    <TableCell>{doc.nome}</TableCell>
                    <TableCell>{doc.tipo}</TableCell>
                    <TableCell>
                      <Badge variant={doc.status === "aprovado" ? "default" : "secondary"}>
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => downloadDocument(doc.caminho, doc.nome)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(getImageUrl(doc.caminho), '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {doc.status === "pendente" && (
                          <>
                            <Button
                              variant="default"
                              size="icon"
                              onClick={() => updateDocumentStatus(doc.id, "aprovado")}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => updateDocumentStatus(doc.id, "rejeitado")}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="photos">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gym.fotos?.map((foto, index) => (
                <div key={index} className="relative group">
                  <img
                    src={getImageUrl(foto)}
                    alt={`Foto ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => window.open(getImageUrl(foto), '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
