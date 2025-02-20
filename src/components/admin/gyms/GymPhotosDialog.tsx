
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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
  const [isUploading, setIsUploading] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const documentTypes = [
    "Alvará de Funcionamento",
    "CNPJ",
    "Contrato Social",
    "RG/CPF Responsável",
    "Comprovante de Endereço",
    "Foto do Estabelecimento",
    "Outro"
  ];

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

      const { error: documentError } = await supabase
        .from('academia_documentos')
        .insert({
          academia_id: gymId,
          tipo: selectedType,
          nome: file.name,
          caminho: filePath,
          observacoes: description,
          status: 'pendente'
        });

      if (documentError) throw documentError;

      const updatedFotos = [...fotos, filePath];

      const { error: updateError } = await supabase
        .from('academias')
        .update({ fotos: updatedFotos })
        .eq('id', gymId);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Documento adicionado com sucesso",
      });

      setSelectedType("");
      setDescription("");
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

      const { error: documentError } = await supabase
        .from('academia_documentos')
        .delete()
        .eq('caminho', photoPath);

      if (documentError) throw documentError;

      toast({
        title: "Sucesso",
        description: "Documento removido com sucesso",
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
          <DialogTitle>Gerenciar Documentos</DialogTitle>
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

          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label>Tipo de Documento</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descrição/Observações</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione uma descrição ou observações sobre o documento"
              />
            </div>

            <div>
              <Button
                variant="outline"
                disabled={isUploading || !selectedType}
                className="w-full"
                onClick={() => document.getElementById('photo-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Enviando..." : "Adicionar Documento"}
              </Button>
              <input
                type="file"
                id="photo-upload"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
