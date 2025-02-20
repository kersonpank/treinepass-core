
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Gym, GymDocument } from "@/types/gym";
import { InfoTab } from "./tabs/InfoTab";
import { PhotosTab } from "./tabs/PhotosTab";
import { ScheduleTab } from "./tabs/ScheduleTab";
import { ModalitiesTab } from "./tabs/ModalitiesTab";
import { DocumentsTab } from "./tabs/DocumentsTab";

interface GymDetailsContentProps {
  gym: Gym;
  documents?: GymDocument[];
  onDocumentStatusChange: (docId: string, newStatus: string) => void;
  onRestoreDocument: (docId: string) => void;
  onDeleteDocument: (docId: string) => void;
  getImageUrl: (path: string) => string;
}

export function GymDetailsContent({ 
  gym, 
  documents,
  onDocumentStatusChange,
  onRestoreDocument,
  onDeleteDocument,
  getImageUrl,
}: GymDetailsContentProps) {
  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="info">Informações</TabsTrigger>
        <TabsTrigger value="photos">Fotos</TabsTrigger>
        <TabsTrigger value="schedule">Horários</TabsTrigger>
        <TabsTrigger value="modalities">Modalidades</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <InfoTab gym={gym} />
      </TabsContent>

      <TabsContent value="photos">
        <PhotosTab gym={gym} getImageUrl={getImageUrl} />
      </TabsContent>

      <TabsContent value="schedule">
        <ScheduleTab gym={gym} />
      </TabsContent>

      <TabsContent value="modalities">
        <ModalitiesTab gym={gym} />
      </TabsContent>

      <TabsContent value="documents">
        <DocumentsTab
          documents={documents}
          onDocumentStatusChange={onDocumentStatusChange}
          onRestoreDocument={onRestoreDocument}
          onDeleteDocument={onDeleteDocument}
        />
      </TabsContent>
    </Tabs>
  );
}
