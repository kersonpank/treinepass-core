
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { EditGymDialog } from "./EditGymDialog";
import { GymPhotosDialog } from "./GymPhotosDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GymList } from "./GymList";
import { GymDetailsContent } from "./GymDetailsContent";
import type { Gym, GymDocument } from "@/types/gym";

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
              id,
              nome
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Gym[];
    },
  });

  const { data: documents } = useQuery({
    queryKey: ["gymDocuments", selectedGym?.id],
    enabled: !!selectedGym?.id,
    queryFn: async () => {
      // Modificado para incluir todos os documentos, inclusive os marcados como excluídos
      const { data, error } = await supabase
        .from("academia_documentos")
        .select("*")
        .eq("academia_id", selectedGym?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map(doc => ({
        ...doc,
        status: doc.status as GymDocument['status']
      })) as GymDocument[];
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Academias</CardTitle>
      </CardHeader>
      <CardContent>
        <GymList
          gyms={gyms || []}
          onStatusChange={handleStatusChange}
          onEdit={(gym) => {
            setSelectedGym(gym);
            setIsEditDialogOpen(true);
          }}
          onView={(gym) => {
            setSelectedGym(gym);
            setIsViewDialogOpen(true);
          }}
          onPhotos={(gym) => {
            setSelectedGym(gym);
            setIsPhotosDialogOpen(true);
          }}
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
    </Card>
  );
}
