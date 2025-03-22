
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface DocumentsTabProps {
  gymId: string;
  onSuccess: () => void;
}

export function DocumentsTab({ gymId, onSuccess }: DocumentsTabProps) {
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
    "Outro"
  ];

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('academy-documents')
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
      }

      toast({
        title: "Sucesso",
        description: "Documentos adicionados com sucesso",
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

  return (
    <div className="space-y-4">
      <div>
        <Label>Tipo do Documento</Label>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo do documento" />
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
        <Label>Descrição</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Adicione uma descrição do documento"
        />
      </div>

      <div>
        <Button
          variant="outline"
          disabled={isUploading || !selectedType}
          className="w-full"
          onClick={() => document.getElementById('document-upload')?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? "Enviando..." : "Adicionar Documentos"}
        </Button>
        <input
          type="file"
          id="document-upload"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleDocumentUpload}
          multiple
        />
      </div>
    </div>
  );
}
