import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Upload } from "lucide-react";

interface GymPhotosDialogProps {
  gymId: string;
  fotos: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function GymPhotosDialog({
  gymId,
  fotos = [],
  open,
  onOpenChange,
  onSuccess,
}: GymPhotosDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('academy-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const updatedFotos = [...fotos, filePath];

      const { error: updateError } = await supabase
        .from('academias')
        .update({ fotos: updatedFotos })
        .eq('id', gymId);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Foto adicionada com sucesso",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photoPath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('academy-images')
        .remove([photoPath]);

      if (storageError) throw storageError;

      const updatedFotos = fotos.filter(foto => foto !== photoPath);

      const { error: updateError } = await supabase
        .from('academias')
        .update({ fotos: updatedFotos })
        .eq('id', gymId);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Foto removida com sucesso",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
  };

  const getImageUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return `https://jlzkwcgzpfrdgcdjmjao.supabase.co/storage/v1/object/public/academy-images/${path}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Fotos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {fotos.map((foto, index) => (
              <div key={index} className="relative group">
                <img
                  src={getImageUrl(foto)}
                  alt={`Foto ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeletePhoto(foto)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              disabled={isUploading}
              className="w-full"
              onClick={() => document.getElementById('photo-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Enviando..." : "Adicionar Foto"}
            </Button>
            <input
              type="file"
              id="photo-upload"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}