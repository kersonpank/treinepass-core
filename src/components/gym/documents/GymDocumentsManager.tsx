
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, FileInput, Trash2, Upload } from "lucide-react";
import type { GymDocument } from "@/types/gym";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface GymDocumentsManagerProps {
  academiaId: string;
}

export function GymDocumentsManager({ academiaId }: GymDocumentsManagerProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const { data: documents, refetch } = useQuery({
    queryKey: ["gymDocuments", academiaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academia_documentos")
        .select("*")
        .eq("academia_id", academiaId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GymDocument[];
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um arquivo e o tipo do documento",
      });
      return;
    }

    try {
      setUploading(true);

      // Upload do arquivo
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `documents/${academiaId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("academy-documents")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Registro do documento
      const { error: dbError } = await supabase
        .from("academia_documentos")
        .insert({
          academia_id: academiaId,
          nome: selectedFile.name,
          tipo: documentType,
          caminho: filePath,
          observacoes: observacoes,
          status: "pendente"
        });

      if (dbError) throw dbError;

      toast({
        title: "Sucesso",
        description: "Documento enviado com sucesso",
      });

      setSelectedFile(null);
      setDocumentType("");
      setObservacoes("");
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (document: GymDocument) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;

    try {
      const { error } = await supabase
        .from("academia_documentos")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by_gym: true
        })
        .eq("id", document.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Documento excluído com sucesso",
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
  };

  const getDocumentUrl = (path: string) => {
    return `https://jlzkwcgzpfrdgcdjmjao.supabase.co/storage/v1/object/public/academy-documents/${path}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="document">Arquivo</Label>
            <Input
              id="document"
              type="file"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="type">Tipo do Documento</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
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
              className="mt-1"
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading || !selectedFile || !documentType}
            className="w-full"
          >
            {uploading ? (
              "Enviando..."
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Enviar Documento
              </>
            )}
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Documentos Enviados</h3>
          {documents?.length ? (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-semibold">{doc.tipo}</h4>
                    <p className="text-sm text-muted-foreground">{doc.nome}</p>
                    {doc.observacoes && (
                      <p className="text-sm mt-2 text-muted-foreground">
                        {doc.observacoes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        doc.status === "aprovado"
                          ? "default"
                          : doc.status === "rejeitado"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {doc.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(getDocumentUrl(doc.caminho), "_blank")}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Visualizar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum documento enviado</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
