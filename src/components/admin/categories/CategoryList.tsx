import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, ArrowUp, ArrowDown } from "lucide-react";
import { Category } from "./types";

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onUpdateOrder: (categoryId: string, direction: 'up' | 'down') => void;
}

export function CategoryList({ categories, onEdit, onUpdateOrder }: CategoryListProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ordem</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories?.map((category, index) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">{category.nome}</TableCell>
              <TableCell>{category.descricao || "-"}</TableCell>
              <TableCell>
                <Badge
                  variant={category.active ? "default" : "secondary"}
                >
                  {category.active ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onUpdateOrder(category.id, 'up')}
                    disabled={index === 0}
                    className="h-8 w-8"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onUpdateOrder(category.id, 'down')}
                    disabled={index === categories.length - 1}
                    className="h-8 w-8"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(category)}
                    className="h-8 w-8"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}