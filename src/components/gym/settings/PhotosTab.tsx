
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

interface PhotosTabProps {
  fotos?: string[];
  onOpenPhotosDialog: () => void;
}

export function PhotosTab({ fotos, onOpenPhotosDialog }: PhotosTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Fotos da Academia</h3>
        <Button
          type="button"
          onClick={onOpenPhotosDialog}
          className="flex items-center gap-2"
        >
          <Camera className="h-4 w-4" />
          Gerenciar Fotos
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {fotos?.map((foto: string, index: number) => (
          <div key={index} className="relative aspect-square">
            <img
              src={foto}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
