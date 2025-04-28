
// Fix imports and component implementation to handle the missing fields properly
// This version will include proper typing for the annual_discount and corporate_discount fields

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Edit, MoreHorizontal, Trash } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { Plan } from "@/types/plan";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditPlanForm } from "./EditPlanForm";
import { DeletePlanDialog } from "./DeletePlanDialog";

interface PlansListProps {
  plans: any[];
  onPlanEdit?: (plan: any) => void;
  onPlanDelete?: (planId: string) => void;
  onRefresh?: () => void;
}

export function PlansList({ 
  plans, 
  onPlanEdit,
  onPlanDelete,
  onRefresh 
}: PlansListProps) {
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Handler functions
  const handleEditClick = (plan: any) => {
    setSelectedPlan(plan);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (plan: any) => {
    setSelectedPlan(plan);
    setIsDeleteDialogOpen(true);
  };

  const handleEditSubmit = () => {
    setIsEditDialogOpen(false);
    if (onRefresh) onRefresh();
  };

  const handleDeleteConfirm = async () => {
    if (selectedPlan && onPlanDelete) {
      await onPlanDelete(selectedPlan.id);
    }
    setIsDeleteDialogOpen(false);
    if (onRefresh) onRefresh();
  };

  // Safe accessor function to handle potentially missing fields
  const getPlanField = (plan: any, field: string, defaultValue: any = null) => {
    return plan[field] !== undefined ? plan[field] : defaultValue;
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Preço</TableHead>
            <TableHead className="text-right">Desconto anual</TableHead>
            <TableHead className="text-right">Desconto corporativo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="font-medium">{plan.name}</TableCell>
              <TableCell>
                {plan.plan_type === "individual" && "Individual"}
                {plan.plan_type === "corporate" && "Corporativo"}
                {plan.plan_type === "corporate_subsidized" && "Corporativo Subsidiado"}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(plan.monthly_cost)}
                {plan.period_type === "monthly" && "/mês"}
                {plan.period_type === "yearly" && "/ano"}
              </TableCell>
              <TableCell className="text-right">
                {getPlanField(plan, 'annual_discount', 0)}%
              </TableCell>
              <TableCell className="text-right">
                {getPlanField(plan, 'corporate_discount', 0)}%
              </TableCell>
              <TableCell>
                {plan.status === "active" && (
                  <Badge variant="default" className="bg-green-500">Ativo</Badge>
                )}
                {plan.status === "inactive" && (
                  <Badge variant="outline">Inativo</Badge>
                )}
                {plan.status === "draft" && (
                  <Badge variant="secondary">Rascunho</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditClick(plan)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteClick(plan)}
                      className="text-red-600"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit plan dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar plano</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <EditPlanForm 
              plan={{
                ...selectedPlan,
                // Ensure required fields exist with default values if missing
                payment_methods: selectedPlan.payment_methods || ["credit_card", "pix", "boleto"],
                check_in_rules: selectedPlan.check_in_rules || {
                  daily_limit: null,
                  weekly_limit: null,
                  monthly_limit: null,
                  extra_checkin_cost: null,
                  allow_extra_checkins: false
                },
                auto_renewal: selectedPlan.auto_renewal !== undefined ? selectedPlan.auto_renewal : true,
                cancellation_rules: selectedPlan.cancellation_rules || {
                  user_can_cancel: true,
                  company_can_cancel: true,
                  notice_period_days: 30
                }
              }}
              onSubmit={handleEditSubmit}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete plan dialog */}
      <DeletePlanDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        planName={selectedPlan?.name || ""}
      />
    </div>
  );
}
