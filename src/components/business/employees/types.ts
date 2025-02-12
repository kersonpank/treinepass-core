
import { z } from "zod";

export const addEmployeeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(11, "CPF é obrigatório"),
  birth_date: z.string().min(1, "Data de nascimento é obrigatória"),
  department: z.string().optional(),
  costCenter: z.string().optional(),
  planId: z.string().uuid("Selecione um plano").optional()
});

export type AddEmployeeForm = z.infer<typeof addEmployeeSchema>;

export interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
}

export interface AddEmployeeFormProps {
  form: any;
  activePlans: Array<{
    plan_id: string;
    benefit_plans: {
      name: string;
    };
  }> | undefined;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (data: AddEmployeeForm) => Promise<void>;
}
