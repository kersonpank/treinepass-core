import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Upload, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { compressImage } from "@/utils/imageCompression";

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
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploading(true);
      const uploadPromises = files.map(async (file) => {
        try {
          // Comprimir a imagem
          const compressedBlob = await compressImage(file);
          const compressedFile = new File([compressedBlob], file.name, {
            type: 'image/jpeg',
          });

          // Upload para o Supabase Storage
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
          const filePath = `${gymId}/${fileName}`;

          const { error: uploadError, data } = await supabase.storage
            .from('academy-images')
            .upload(filePath, compressedFile, {
              cacheControl: '3600',
              upsert: false,
              onUploadProgress: (progress) => {
                setUploadProgress(prev => ({
                  ...prev,
                  [fileName]: Math.round((progress.loaded / progress.total) * 100),
                }));
              },
            });

          if (uploadError) throw uploadError;

          return data.path;
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          throw error;
        }
      });

      const newPaths = await Promise.all(uploadPromises);

      // Atualizar o registro da academia com os novos caminhos
      const newPhotos = [...fotos, ...newPaths];
      const { error: updateError } = await supabase
        .from('academias')
        .update({ fotos: newPhotos })
        .eq('id', gymId);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: `${files.length} foto${files.length > 1 ? 's' : ''} adicionada${files.length > 1 ? 's' : ''} com sucesso`,
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
      setUploadProgress({});
    }
  };

  const handleDeletePhoto = async (photoPath: string) => {
    if (!confirm("Tem certeza que deseja excluir esta foto?")) return;

    try {
      // Remove from Storage
      const { error: deleteError } = await supabase.storage
        .from('academy-images')
        .remove([photoPath]);

      if (deleteError) throw deleteError;

      // Update academy record
      const newPhotos = fotos.filter(foto => foto !== photoPath);
      const { error: updateError } = await supabase
        .from('academias')
        .update({ fotos: newPhotos })
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
          <div>
            <Label htmlFor="photo">Adicionar Novas Fotos</Label>
            <div className="flex gap-2">
              <Input
                id="photo"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </div>
            {isUploading && Object.keys(uploadProgress).length > 0 && (
              <div className="mt-2 space-y-2">
                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                  <div key={fileName} className="space-y-1">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{fileName}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              {isUploading ? "Aguarde..." : "Fechar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
