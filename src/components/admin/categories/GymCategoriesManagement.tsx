import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CategoryRulesDialog } from "./CategoryRulesDialog";

interface GymCategory {
  id: string;
  nome: string;
  descricao: string | null;
  valor_repasse_checkin: number;
  active: boolean;
}

export function GymCategoriesManagement() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<GymCategory | null>(null);
  const [isRulesDialogOpen, setIsRulesDialogOpen] = useState(false);

  const { data: categories, isLoading, refetch } = useQuery({
    queryKey: ["gymCategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academia_categorias")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data as GymCategory[];
    },
  });

  const handleStatusChange = async (categoryId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("academia_categorias")
        .update({ active: newStatus })
        .eq("id", categoryId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Status da categoria atualizado`,
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

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

    try {
      const { error } = await supabase
        .from("academia_categorias")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso",
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Categorias de Academia</CardTitle>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor Base</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.nome}</TableCell>
                  <TableCell>{category.descricao}</TableCell>
                  <TableCell>R$ {category.valor_repasse_checkin.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={category.active ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => handleStatusChange(category.id, !category.active)}
                    >
                      {category.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsRulesDialogOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category.id)}
                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {selectedCategory && (
        <CategoryRulesDialog
          category={selectedCategory}
          open={isRulesDialogOpen}
          onOpenChange={setIsRulesDialogOpen}
          onSuccess={refetch}
        />
      )}
    </Card>
  );
}