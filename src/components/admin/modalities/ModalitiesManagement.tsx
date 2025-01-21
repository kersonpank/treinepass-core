import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Modality {
  id: string;
  nome: string;
  descricao: string | null;
  active: boolean;
}

export function ModalitiesManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingModality, setEditingModality] = useState<Modality | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: modalities, isLoading } = useQuery({
    queryKey: ["modalities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modalidades")
        .select("*")
        .order("nome");
      
      if (error) throw error;
      return data as Modality[];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingModality) {
        const { error } = await supabase
          .from("modalidades")
          .update({ nome, descricao })
          .eq("id", editingModality.id);

        if (error) throw error;

        toast({
          title: "Modalidade atualizada",
          description: "A modalidade foi atualizada com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from("modalidades")
          .insert([{ nome, descricao }]);

        if (error) throw error;

        toast({
          title: "Modalidade criada",
          description: "A nova modalidade foi adicionada com sucesso.",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["modalities"] });
      setIsCreateDialogOpen(false);
      setEditingModality(null);
      setNome("");
      setDescricao("");
    } catch (error) {
      console.error("Error saving modality:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar modalidade",
        description: "Ocorreu um erro ao salvar a modalidade. Tente novamente.",
      });
    }
  };

  const toggleModalityStatus = async (modality: Modality) => {
    try {
      const { error } = await supabase
        .from("modalidades")
        .update({ active: !modality.active })
        .eq("id", modality.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["modalities"] });
      
      toast({
        title: modality.active ? "Modalidade desativada" : "Modalidade ativada",
        description: `A modalidade foi ${modality.active ? "desativada" : "ativada"} com sucesso.`,
      });
    } catch (error) {
      console.error("Error toggling modality status:", error);
      toast({
        variant: "destructive",
        title: "Erro ao alterar status",
        description: "Ocorreu um erro ao alterar o status da modalidade.",
      });
    }
  };

  const handleEdit = (modality: Modality) => {
    setEditingModality(modality);
    setNome(modality.nome);
    setDescricao(modality.descricao || "");
    setIsCreateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Modalidades</h2>
          <p className="text-muted-foreground">
            Gerencie as modalidades disponíveis no sistema
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Modalidade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingModality ? "Editar Modalidade" : "Nova Modalidade"}
              </DialogTitle>
              <DialogDescription>
                {editingModality
                  ? "Atualize as informações da modalidade selecionada."
                  : "Preencha as informações para criar uma nova modalidade."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="nome" className="text-sm font-medium">
                  Nome
                </label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="descricao" className="text-sm font-medium">
                  Descrição
                </label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit">
                  {editingModality ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modalidades Cadastradas</CardTitle>
          <CardDescription>
            Lista de todas as modalidades disponíveis no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modalities?.map((modality) => (
                  <TableRow key={modality.id}>
                    <TableCell className="font-medium">
                      {modality.nome}
                    </TableCell>
                    <TableCell>{modality.descricao || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={modality.active ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {modality.active ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(modality)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={modality.active}
                          onCheckedChange={() => toggleModalityStatus(modality)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}