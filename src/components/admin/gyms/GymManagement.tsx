
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { EditGymDialog } from "./EditGymDialog";
import { GymPhotosDialog } from "./GymPhotosDialog";
import { GymDetailsDialog } from "./GymDetailsDialog";
import { GymMetricsCards } from "./components/GymMetricsCards";
import { GymsTable } from "./components/GymsTable";
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

      return gymsWithDocs as unknown as Gym[];
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
        <GymMetricsCards gyms={gyms} />
        
        <GymsTable
          gyms={gyms}
          onView={(gym) => {
            setSelectedGym(gym);
            setIsDetailsDialogOpen(true);
          }}
          onEdit={(gym) => {
            setSelectedGym(gym);
            setIsEditDialogOpen(true);
          }}
          onPhotos={(gym) => {
            setSelectedGym(gym);
            setIsPhotosDialogOpen(true);
          }}
        />
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
