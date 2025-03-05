
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Upload } from "lucide-react";

interface PhotosTabProps {
  gymId: string;
  fotos: string[];
  onSuccess: () => void;
}

export function PhotosTab({ gymId, fotos, onSuccess }: PhotosTabProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const updatedFotos = [...fotos];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('academy-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        updatedFotos.push(filePath);
      }

      const { error: updateError } = await supabase
        .from('academias')
        .update({ fotos: updatedFotos })
        .eq('id', gymId);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Fotos adicionadas com sucesso",
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
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/academy-images/${path}`;
  };

  return (
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

      <div>
        <Button
          variant="outline"
          disabled={isUploading}
          className="w-full"
          onClick={() => document.getElementById('photo-upload')?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? "Enviando..." : "Adicionar Fotos"}
        </Button>
        <input
          type="file"
          id="photo-upload"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
          multiple
        />
      </div>
    </div>
  );
}
