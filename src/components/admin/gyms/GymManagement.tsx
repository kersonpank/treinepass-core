
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
import { Edit2, Eye, Image, Building2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { EditGymDialog } from "./EditGymDialog";
import { GymPhotosDialog } from "./GymPhotosDialog";
import { GymDetailsDialog } from "./GymDetailsDialog";
import type { Gym } from "@/types/gym";

export function GymManagement() {
  const { toast } = useToast();
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPhotosDialogOpen, setIsPhotosDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const { data: gyms, isLoading, refetch } = useQuery({
    queryKey: ["adminGyms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academias")
        .select(`
          *,
          academia_modalidades (
            modalidade:modalidades (
              id,
              nome
            )
          ),
          categoria:academia_categorias (
            nome,
            valor_repasse_checkin
          ),
          academia_documentos (
            id,
            nome,
            tipo,
            caminho,
            status,
            observacoes
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const gymsWithDocs = data.map(gym => ({
        ...gym,
        documentos: gym.academia_documentos || []
      }));

      return gymsWithDocs as Gym[];
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
        description: "Status da academia atualizado com sucesso"
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Academias</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Academias
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {gyms?.length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Academias Pendentes
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {gyms?.filter(gym => gym.status === "pendente").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Academia</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Modalidades</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gyms?.map((gym) => (
                <TableRow key={gym.id}>
                  <TableCell className="font-medium">{gym.nome}</TableCell>
                  <TableCell>{gym.cnpj}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{gym.email}</span>
                      <span className="text-muted-foreground">{gym.telefone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {gym.categoria?.nome || "Sem categoria"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {gym.modalidades?.map((modalidade, index) => (
                        <Badge key={index} variant="secondary">
                          {modalidade}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={gym.status === "ativo" ? "default" : "secondary"}
                    >
                      {gym.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedGym(gym);
                          setIsDetailsDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
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
                        onClick={() => {
                          setSelectedGym(gym);
                          setIsPhotosDialogOpen(true);
                        }}
                      >
                        <Image className="h-4 w-4" />
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
          <GymDetailsDialog
            gym={selectedGym}
            open={isDetailsDialogOpen}
            onOpenChange={setIsDetailsDialogOpen}
            onStatusChange={handleStatusChange}
          />
          <EditGymDialog
            gym={selectedGym}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={() => {
              refetch();
              setIsEditDialogOpen(false);
            }}
          />
          <GymPhotosDialog
            gymId={selectedGym.id}
            fotos={selectedGym.fotos || []}
            open={isPhotosDialogOpen}
            onOpenChange={setIsPhotosDialogOpen}
            onSuccess={() => {
              refetch();
              setIsPhotosDialogOpen(false);
            }}
          />
        </>
      )}
    </Card>
  );
}
