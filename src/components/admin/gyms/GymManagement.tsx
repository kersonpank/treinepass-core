import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit2, Eye, Trash2, CheckCircle2, XCircle, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { EditGymDialog } from "./EditGymDialog";
import { GymPhotosDialog } from "./GymPhotosDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gym } from "@/types/gym";

export function GymManagement() {
  const { toast } = useToast();
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPhotosDialogOpen, setIsPhotosDialogOpen] = useState(false);

  const { data: gyms, isLoading, refetch } = useQuery({
    queryKey: ["adminGyms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academias")
        .select(`
          *,
          academia_modalidades (
            modalidade:modalidades (
              nome
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Gym[];
    },
  });

  const handleStatusChange = async (gymId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("academias")
        .update({ status: newStatus })
        .eq("id", gymId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Status da academia atualizado para ${newStatus}`,
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
  };

  const handleDelete = async (gymId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta academia?")) return;

    try {
      const gym = gyms?.find(g => g.id === gymId);
      if (gym?.fotos?.length) {
        const { error: storageError } = await supabase.storage
          .from('academy-images')
          .remove(gym.fotos);

        if (storageError) throw storageError;
      }

      const { error } = await supabase
        .from("academias")
        .delete()
        .eq("id", gymId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Academia excluída com sucesso",
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
  };

  const getImageUrl = (path: string) => {
    if (path?.startsWith('http')) return path;
    return `https://jlzkwcgzpfrdgcdjmjao.supabase.co/storage/v1/object/public/academy-images/${path}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Academias</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gyms?.map((gym) => (
                <TableRow key={gym.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {gym.fotos?.[0] && (
                        <img
                          src={getImageUrl(gym.fotos[0])}
                          alt={gym.nome}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      {gym.nome}
                    </div>
                  </TableCell>
                  <TableCell>{gym.cnpj}</TableCell>
                  <TableCell>{gym.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={gym.status === "ativo" ? "default" : gym.status === "inativo" ? "secondary" : "outline"}
                    >
                      {gym.status === "ativo" ? "Ativo" : gym.status === "inativo" ? "Inativo" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-2">
                      {gym.status === "pendente" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusChange(gym.id, "ativo")}
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      {gym.status === "ativo" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusChange(gym.id, "inativo")}
                          className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {gym.status === "inativo" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusChange(gym.id, "ativo")}
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedGym(gym);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedGym(gym);
                          setIsPhotosDialogOpen(true);
                        }}
                      >
                        <Image className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedGym(gym);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(gym.id)}
                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {selectedGym && (
        <>
          <EditGymDialog
            gym={selectedGym}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={refetch}
          />

          <GymPhotosDialog
            gymId={selectedGym.id}
            fotos={selectedGym.fotos || []}
            open={isPhotosDialogOpen}
            onOpenChange={setIsPhotosDialogOpen}
            onSuccess={refetch}
          />

          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Detalhes da Academia</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="schedule">Horários</TabsTrigger>
                  <TabsTrigger value="modalities">Modalidades</TabsTrigger>
                </TabsList>
                <TabsContent value="info" className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Nome</h4>
                    <p>{selectedGym.nome}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">CNPJ</h4>
                    <p>{selectedGym.cnpj}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Email</h4>
                    <p>{selectedGym.email}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Telefone</h4>
                    <p>{selectedGym.telefone || "-"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Endereço</h4>
                    <p>{selectedGym.endereco || "-"}</p>
                  </div>
                </TabsContent>
                <TabsContent value="schedule">
                  {selectedGym.horario_funcionamento ? (
                    <div className="space-y-2">
                      {Object.entries(selectedGym.horario_funcionamento).map(([dia, horario]: [string, any]) => (
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
                  {selectedGym.academia_modalidades?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedGym.academia_modalidades.map((am, index) => (
                        <Badge key={index} variant="secondary">
                          {am.modalidade.nome}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhuma modalidade cadastrada</p>
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </>
      )}
    </Card>
  );
}
