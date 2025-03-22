
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { EditGymDialog } from "./EditGymDialog";
import { GymPhotosDialog } from "./GymPhotosDialog";
<<<<<<< HEAD
import { GymDetailsDialog } from "./GymDetailsDialog";
import { GymMetricsCards } from "./components/GymMetricsCards";
import { GymsTable } from "./components/GymsTable";
import type { Gym } from "@/types/gym";
=======
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GymList } from "./GymList";
import { GymDetailsContent } from "./GymDetailsContent";
import type { Gym, GymDocument } from "@/types/gym";
>>>>>>> main

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
<<<<<<< HEAD

      const gymsWithDocs = data.map(gym => ({
        ...gym,
        documentos: gym.academia_documentos || []
      }));

      return gymsWithDocs as unknown as Gym[];
=======
      return data as unknown as Gym[];
    },
  });

  const { data: documents } = useQuery({
    queryKey: ["gymDocuments", selectedGym?.id],
    enabled: !!selectedGym?.id,
    queryFn: async () => {
      console.log("Fetching documents for gym:", selectedGym?.id);
      
      const { data, error } = await supabase
        .from("academia_documentos")
        .select("*")
        .eq("academia_id", selectedGym?.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching documents:", error);
        throw error;
      }

      console.log("Documents found:", data);

      return (data || []).map(doc => ({
        ...doc,
        status: doc.status as GymDocument['status']
      })) as GymDocument[];
>>>>>>> main
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

<<<<<<< HEAD
=======
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

  const handleDocumentStatusChange = async (docId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("academia_documentos")
        .update({ 
          status: newStatus,
          revisado_por: (await supabase.auth.getUser()).data.user?.id 
        })
        .eq("id", docId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Status do documento atualizado para ${newStatus}`,
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

  const handleRestoreDocument = async (docId: string) => {
    try {
      const { error } = await supabase
        .from("academia_documentos")
        .update({ 
          deleted_at: null,
          deleted_by_gym: false 
        })
        .eq("id", docId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Documento restaurado com sucesso",
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

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este documento?")) return;

    try {
      const { error } = await supabase
        .from("academia_documentos")
        .delete()
        .eq("id", docId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Documento excluído permanentemente",
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

>>>>>>> main
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Academias</CardTitle>
      </CardHeader>
      <CardContent>
<<<<<<< HEAD
        <GymMetricsCards gyms={gyms} />
        
        <GymsTable
          gyms={gyms}
          onView={(gym) => {
            setSelectedGym(gym);
            setIsDetailsDialogOpen(true);
          }}
=======
        <GymList
          gyms={gyms || []}
          onStatusChange={handleStatusChange}
>>>>>>> main
          onEdit={(gym) => {
            setSelectedGym(gym);
            setIsEditDialogOpen(true);
          }}
<<<<<<< HEAD
=======
          onView={(gym) => {
            setSelectedGym(gym);
            setIsViewDialogOpen(true);
          }}
>>>>>>> main
          onPhotos={(gym) => {
            setSelectedGym(gym);
            setIsPhotosDialogOpen(true);
          }}
<<<<<<< HEAD
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
=======
          onDelete={handleDelete}
          getImageUrl={getImageUrl}
        />

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
                <GymDetailsContent
                  gym={selectedGym}
                  documents={documents}
                  onDocumentStatusChange={handleDocumentStatusChange}
                  onRestoreDocument={handleRestoreDocument}
                  onDeleteDocument={handleDeleteDocument}
                  getImageUrl={getImageUrl}
                />
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
>>>>>>> main
    </Card>
  );
}
