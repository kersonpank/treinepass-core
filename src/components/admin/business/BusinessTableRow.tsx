import { Business } from "./types/business";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Eye, Edit2, Trash2, CheckCircle2, XCircle, CreditCard } from "lucide-react";

interface BusinessTableRowProps {
  business: Business;
  onStatusChange: (businessId: string, newStatus: string) => void;
  onDelete: (businessId: string) => void;
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
  return (
    <TableRow>
      <TableCell className="font-medium">{business.company_name}</TableCell>
      <TableCell>{business.cnpj}</TableCell>
      <TableCell>{business.email}</TableCell>
      <TableCell>{business.number_of_employees}</TableCell>
      <TableCell>
        <Badge
          variant={
            business.status === "active"
              ? "default"
              : business.status === "inactive"
                ? "secondary"
                : "outline"
          }
        >
          {business.status === "active"
            ? "Ativo"
            : business.status === "inactive"
              ? "Inativo"
              : "Pendente"}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant={
            business.user_plan_subscriptions?.[0]?.status === "active"
              ? "default"
              : "outline"
          }
        >
          {business.user_plan_subscriptions?.[0]?.status === "active"
            ? "Ativo"
            : "Sem plano"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex justify-end space-x-2">
          {business.status === "pending" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onStatusChange(business.id, "active")}
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
          {business.status === "active" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onStatusChange(business.id, "inactive")}
              className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
          {business.status === "inactive" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onStatusChange(business.id, "active")}
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPlanManage(business)}
          >
            <CreditCard className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(business)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onView(business)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(business.id)}
            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}