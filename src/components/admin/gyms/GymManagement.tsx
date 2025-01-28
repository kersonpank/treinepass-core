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
import { Edit2, Eye, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { EditGymDialog } from "./EditGymDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Gym {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string | null;
  endereco: string | null;
  status: string;
}

export function GymManagement() {
  const { toast } = useToast();
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { data: gyms, isLoading, refetch } = useQuery({
    queryKey: ["adminGyms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academias")
        .select("*")
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
                  <TableCell className="font-medium">{gym.nome}</TableCell>
                  <TableCell>{gym.cnpj}</TableCell>
                  <TableCell>{gym.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={gym.status === "ativo" ? "default" : "secondary"}
                    >
                      {gym.status === "ativo" ? "Ativo" : "Pendente"}
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
                          onClick={() => handleStatusChange(gym.id, "pendente")}
                          className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                        >
                          <XCircle className="h-4 w-4" />
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

          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Detalhes da Academia</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Nome</h4>
                  <p>{selectedGym.nome}</p>
                </div>
                <div>
                  <h4 className="font-medium">CNPJ</h4>
                  <p>{selectedGym.cnpj}</p>
                </div>
                <div>
                  <h4 className="font-medium">Email</h4>
                  <p>{selectedGym.email}</p>
                </div>
                <div>
                  <h4 className="font-medium">Telefone</h4>
                  <p>{selectedGym.telefone || "Não informado"}</p>
                </div>
                <div>
                  <h4 className="font-medium">Endereço</h4>
                  <p>{selectedGym.endereco || "Não informado"}</p>
                </div>
                <div>
                  <h4 className="font-medium">Status</h4>
                  <Badge variant={selectedGym.status === "ativo" ? "default" : "secondary"}>
                    {selectedGym.status === "ativo" ? "Ativo" : "Pendente"}
                  </Badge>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </Card>
  );
}