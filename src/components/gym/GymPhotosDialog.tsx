import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface GymPhotosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gymId: string;
  onSuccess: () => void;
  fotos?: Json;
}

export function GymPhotosDialog({
  open,
  onOpenChange,
  gymId,
  onSuccess,
  fotos = []
}: GymPhotosDialogProps) {
  const [newPhotos, setNewPhotos] = useState<string[]>(fotos as string[] || []);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `gym-photos/${gymId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: imageUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      if (imageUrlData?.publicUrl) {
        setNewPhotos(prevPhotos => [...prevPhotos, imageUrlData.publicUrl]);
      } else {
        console.error("Failed to get public URL after upload.");
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSavePhotos = async () => {
    try {
      const { error: updateError } = await supabase
        .from('academias')
        .update({ fotos: newPhotos })
        .eq('id', gymId);

      if (updateError) {
        throw updateError;
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating gym photos:", error);
    }
  };

  const handleDeletePhoto = (indexToDelete: number) => {
    setNewPhotos(prevPhotos => prevPhotos.filter((_, index) => index !== indexToDelete));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">Gerenciar Fotos da Academia</h2>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {newPhotos.map((photo, index) => (
            <div key={index} className="relative">
              <img src={photo} alt={`Gym Photo ${index + 1}`} className="rounded-md aspect-video object-cover w-full" />
              <button
                onClick={() => handleDeletePhoto(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <label htmlFor="upload" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            {uploading ? "Enviando..." : "Adicionar Foto"}
            <input type="file" id="upload" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ml-2"
            onClick={handleSavePhotos}
            disabled={uploading}
          >
            Salvar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
