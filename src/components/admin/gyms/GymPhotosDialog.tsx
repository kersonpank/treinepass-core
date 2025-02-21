
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PhotosTab } from "./photos/PhotosTab";
import { DocumentsTab } from "./documents/DocumentsTab";

interface GymPhotosDialogProps {
  gymId: string;
  fotos?: string[];
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Fotos e Documentos</DialogTitle>
          <DialogDescription>
            Adicione fotos do estabelecimento e documentos necessários
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="photos">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="photos">Fotos</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="space-y-4">
            <PhotosTab 
              gymId={gymId} 
              fotos={fotos} 
              onSuccess={onSuccess}
            />
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <DocumentsTab 
              gymId={gymId}
              onSuccess={onSuccess}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
