
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Eye, Edit, Trash2, CreditCard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Business } from "./types/business";

interface BusinessTableRowProps {
  business: Business;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onView: (business: Business) => void;
  onEdit: (business: Business) => void;
  onPlanManage: (business: Business) => void;
}

export function BusinessTableRow({
  business,
  onStatusChange,
  onDelete,
  onView,
  onEdit,
  onPlanManage,
}: BusinessTableRowProps) {
  const activePlan = business.business_plan_subscriptions?.find(
    (sub) => sub.status === "active"
  );

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{business.company_name}</div>
        <div className="text-sm text-muted-foreground">
          CNPJ: {business.cnpj}
        </div>
      </TableCell>
      <TableCell>
        <div>{business.contact_person}</div>
        <div className="text-sm text-muted-foreground">{business.contact_email}</div>
      </TableCell>
      <TableCell>
        {activePlan ? (
          <div>
            <Badge variant="secondary" className="mb-1">
              {activePlan.benefit_plans?.name}
            </Badge>
            <div className="text-sm text-muted-foreground">
              Início: {new Date(activePlan.start_date || "").toLocaleDateString()}
            </div>
          </div>
        ) : (
          <Badge variant="outline">Sem plano ativo</Badge>
        )}
      </TableCell>
      <TableCell>
        <Badge
          variant={
            business.status === "active"
              ? "success"
              : business.status === "pending"
              ? "warning"
              : "destructive"
          }
        >
          {business.status === "active"
            ? "Ativa"
            : business.status === "pending"
            ? "Pendente"
            : "Inativa"}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(business)}>
              <Eye className="mr-2 h-4 w-4" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(business)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPlanManage(business)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Gerenciar Plano
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {business.status === "active" ? (
              <DropdownMenuItem
                onClick={() => onStatusChange(business.id, "inactive")}
                className="text-amber-600"
              >
                Desativar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => onStatusChange(business.id, "active")}
                className="text-green-600"
              >
                Ativar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(business.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
