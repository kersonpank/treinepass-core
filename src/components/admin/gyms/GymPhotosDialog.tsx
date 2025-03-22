<<<<<<< HEAD

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
=======

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
>>>>>>> main
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
  fotos = [],
  onSuccess
}: GymPhotosDialogProps) {
<<<<<<< HEAD
=======
  const [isUploading, setIsUploading] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [description, setDescription] = useState("");
>>>>>>> main
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

<<<<<<< HEAD
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
=======
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
>>>>>>> main

    setIsUploading(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('academy-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

<<<<<<< HEAD
=======
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

>>>>>>> main
      const { error: updateError } = await supabase
        .from('academias')
        .update({
          fotos: [...(fotos || []), fileName]
        })
        .eq('id', gymId);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
<<<<<<< HEAD
        description: "Foto adicionada com sucesso"
=======
        description: "Documento adicionado com sucesso",
>>>>>>> main
      });

      setSelectedType("");
      setDescription("");
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

  const handleDelete = async (fotoIndex: number) => {
    try {
      const fotoToDelete = fotos[fotoIndex];
      
      // Deletar do storage
      const { error: deleteStorageError } = await supabase.storage
        .from('academy-images')
        .remove([fotoToDelete]);

      if (deleteStorageError) throw deleteStorageError;

      // Atualizar array de fotos
      const newFotos = fotos.filter((_, index) => index !== fotoIndex);
      
      const { error: updateError } = await supabase
        .from('academias')
        .update({ fotos: newFotos })
        .eq('id', gymId);

      if (updateError) throw updateError;

      const { error: documentError } = await supabase
        .from('academia_documentos')
        .delete()
        .eq('caminho', photoPath);

      if (documentError) throw documentError;

      toast({
        title: "Sucesso",
<<<<<<< HEAD
        description: "Foto removida com sucesso"
=======
        description: "Documento removido com sucesso",
>>>>>>> main
      });

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao remover foto",
        description: error.message
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Documentos</DialogTitle>
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
              <div key={index} className="relative group aspect-square">
                <img
                  src={`${supabase.supabaseUrl}/storage/v1/object/public/academy-images/${foto}`}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(index)}
                >
                  Remover
                </Button>
              </div>
            ))}
          </div>
<<<<<<< HEAD
=======

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
>>>>>>> main
        </div>
      </DialogContent>
    </Dialog>
  );
}
