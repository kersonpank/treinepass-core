
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface FileUploadsFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

interface TempDocument {
  file: File;
  tipo: string;
  observacoes: string;
}

export function FileUploadsForm({ register, errors }: FileUploadsFormProps) {
  const [documentos, setDocumentos] = useState<TempDocument[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleAddDocument = () => {
    if (selectedFile && selectedType) {
      setDocumentos([
        ...documentos,
        {
          file: selectedFile,
          tipo: selectedType,
          observacoes
        }
      ]);
      setSelectedFile(null);
      setSelectedType("");
      setObservacoes("");
    }
  };

  const handleRemoveDocument = (index: number) => {
    setDocumentos(documentos.filter((_, i) => i !== index));
  };

  // Registrar os documentos no form
  register("documentos", { value: documentos });

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fotos">Fotos do Espaço</Label>
        <Input
          id="fotos"
          type="file"
          accept="image/*"
          multiple
          {...register("fotos")}
        />
        {errors.fotos && (
          <p className="text-sm text-red-500">{errors.fotos.message as string}</p>
        )}
      </div>

      <div className="border-t pt-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Documentos</h3>
          <Badge variant="outline" className="text-gray-500">
            Opcional - Pode ser adicionado posteriormente
          </Badge>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="documento">Arquivo</Label>
            <Input
              id="documento"
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </div>

          <div>
            <Label htmlFor="tipo">Tipo do Documento</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alvara">Alvará</SelectItem>
                <SelectItem value="contrato_social">Contrato Social</SelectItem>
                <SelectItem value="documento_identidade">Documento de Identidade</SelectItem>
                <SelectItem value="comprovante_endereco">Comprovante de Endereço</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre o documento"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddDocument}
            disabled={!selectedFile || !selectedType}
          >
            Adicionar Documento
          </Button>
        </div>

        {documentos.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Documentos Adicionados:</h4>
            {documentos.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{doc.tipo}</p>
                  <p className="text-sm text-gray-500">{doc.file.name}</p>
                  {doc.observacoes && (
                    <p className="text-sm text-gray-500">{doc.observacoes}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveDocument(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
