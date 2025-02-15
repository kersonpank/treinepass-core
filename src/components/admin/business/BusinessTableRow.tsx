
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

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
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "pending":
        return "secondary";
      default:
        return "destructive";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Ativa";
      case "pending":
        return "Pendente";
      default:
        return "Inativa";
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    const addressParts = address.split(",").map(part => part.trim());
    return addressParts.join(" - ");
  };

  // Modificação na lógica de verificação de planos ativos
  const activePlans = business.business_plan_subscriptions?.filter(
    sub => sub.status === "active" && sub.benefit_plans && sub.benefit_plans.status === "active"
  ) || [];

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <div className="font-medium">{business.company_name}</div>
          <div className="text-sm text-muted-foreground">{business.cnpj}</div>
          <div className="text-sm text-muted-foreground">
            {formatAddress(business.address)}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <div className="font-medium">{business.contact_person}</div>
          <div className="text-sm text-muted-foreground">
            {business.contact_email}
          </div>
          <div className="text-sm text-muted-foreground">
            {business.contact_phone}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{business.number_of_employees || 0}</div>
      </TableCell>
      <TableCell>
        <ScrollArea className="h-20">
          {activePlans.length > 0 ? (
            activePlans.map((sub, index) => (
              <div key={index} className="mb-2 last:mb-0">
                <Badge variant="secondary" className="mb-1">
                  {sub.benefit_plans?.name}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(sub.start_date), "dd/MM/yyyy")}
                  {sub.end_date && ` - ${format(new Date(sub.end_date), "dd/MM/yyyy")}`}
                </div>
              </div>
            ))
          ) : (
            <Badge variant="outline">Sem plano ativo</Badge>
          )}
        </ScrollArea>
      </TableCell>
      <TableCell>
        <Badge variant={getStatusBadgeVariant(business.status)}>
          {getStatusLabel(business.status)}
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
