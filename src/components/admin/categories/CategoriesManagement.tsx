import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { CategoryDialog } from "./CategoryDialog";
import { CategoryList } from "./CategoryList";
import { Category } from "./types";

export function CategoriesManagement() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: categories, isLoading, refetch } = useQuery({
    queryKey: ["adminCategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academia_categorias")
        .select("*")
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
  });

  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const categoryData = {
      nome: formData.get("nome") as string,
      descricao: formData.get("descricao") as string,
      active: formData.get("active") === "true",
    };

    try {
      if (selectedCategory) {
        const { error } = await supabase
          .from("academia_categorias")
          .update(categoryData)
          .eq("id", selectedCategory.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso",
        });
      } else {
        const { error } = await supabase
          .from("academia_categorias")
          .insert([categoryData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Categoria criada com sucesso",
        });
      }

      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
  };

  const handleUpdateOrder = async (categoryId: string, direction: 'up' | 'down') => {
    if (!categories) return;
    
    const currentIndex = categories.findIndex(c => c.id === categoryId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;
    
    try {
      const updates = [
        {
          id: categories[currentIndex].id,
          ordem: categories[newIndex].ordem
        },
        {
          id: categories[newIndex].id,
          ordem: categories[currentIndex].ordem
        }
      ];
      
      for (const update of updates) {
        const { error } = await supabase
          .from("academia_categorias")
          .update({ ordem: update.ordem })
          .eq("id", update.id);
          
        if (error) throw error;
      }
      
      refetch();
      
      toast({
        title: "Sucesso",
        description: "Ordem atualizada com sucesso",
      });
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
        <CardTitle>Gerenciamento de Categorias</CardTitle>
        <Button
          onClick={() => {
            setSelectedCategory(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </CardHeader>
      <CardContent>
        <CategoryList
          categories={categories || []}
          onEdit={(category) => {
            setSelectedCategory(category);
            setIsDialogOpen(true);
          }}
          onUpdateOrder={handleUpdateOrder}
        />

        <CategoryDialog
          category={selectedCategory}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSaveCategory}
        />
      </CardContent>
    </Card>
  );
}