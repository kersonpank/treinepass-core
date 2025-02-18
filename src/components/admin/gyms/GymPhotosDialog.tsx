
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
  onSuccess,
  fotos = []
}: GymPhotosDialogProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    setIsUploading(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${gymId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('academy-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('academias')
        .update({
          fotos: [...(fotos || []), filePath]
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
              <div key={index} className="relative aspect-square">
                <img
                  src={`https://jlzkwcgzpfrdgcdjmjao.supabase.co/storage/v1/object/public/academy-images/${foto}`}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
