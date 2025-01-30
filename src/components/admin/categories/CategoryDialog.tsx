import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryRepassRules } from "./CategoryRepassRules";
import { Category } from "./types";

interface CategoryDialogProps {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function CategoryDialog({ category, open, onOpenChange, onSave }: CategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {category ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Informações</TabsTrigger>
            {category && (
              <TabsTrigger value="rules">Regras de Repasse</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="info">
            <form onSubmit={onSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  name="nome"
                  defaultValue={category?.nome}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  name="descricao"
                  defaultValue={category?.descricao || ""}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  name="active"
                  defaultChecked={category?.active ?? true}
                  value="true"
                />
                <Label htmlFor="active">Ativo</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {category ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </TabsContent>

          {category && (
            <TabsContent value="rules">
              <CategoryRepassRules categoryId={category.id} />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}