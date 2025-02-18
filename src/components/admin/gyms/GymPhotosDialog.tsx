
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface GymPhotosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gymId: string;
  onSuccess: () => void;
  fotos?: string[];
}

export function GymPhotosDialog({
  open,
  onOpenChange,
  gymId,
  fotos = [],
  onSuccess
}: GymPhotosDialogProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    setIsUploading(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('academy-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('academias')
        .update({
          fotos: [...(fotos || []), fileName]
        })
        .eq('id', gymId);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Foto adicionada com sucesso"
      });

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer upload",
        description: error.message
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (fotoIndex: number) => {
    try {
      const fotoToDelete = fotos[fotoIndex];
      
      // Deletar do storage
      const { error: deleteStorageError } = await supabase.storage
        .from('academy-images')
        .remove([fotoToDelete]);

      if (deleteStorageError) throw deleteStorageError;

      // Atualizar array de fotos
      const newFotos = fotos.filter((_, index) => index !== fotoIndex);
      
      const { error: updateError } = await supabase
        .from('academias')
        .update({ fotos: newFotos })
        .eq('id', gymId);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Foto removida com sucesso"
      });

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao remover foto",
        description: error.message
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Fotos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => document.getElementById('photo-upload')?.click()}
            disabled={isUploading}
          >
            {isUploading ? "Enviando..." : "Adicionar Foto"}
          </Button>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          
          <div className="grid grid-cols-2 gap-4">
            {fotos?.map((foto, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/academy-images/${foto}`}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(index)}
                >
                  Remover
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
