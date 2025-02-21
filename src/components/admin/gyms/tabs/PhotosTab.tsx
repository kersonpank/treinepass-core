
import type { Gym } from "@/types/gym";

interface PhotosTabProps {
  gym: Gym;
  getImageUrl: (path: string) => string;
}

export function PhotosTab({ gym, getImageUrl }: PhotosTabProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {gym.fotos?.map((foto, index) => (
        <div key={index} className="relative aspect-square">
          <img
            src={getImageUrl(foto)}
            alt={`Foto ${index + 1}`}
            className="rounded-lg object-cover w-full h-full"
          />
        </div>
      ))}
    </div>
  );
}
