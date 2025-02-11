
import { z } from "zod";

export const addEmployeeSchema = z.object({
  email: z.string().email("Email inválido"),
  planId: z.string().uuid("Selecione um plano"),
  name: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(1, "CPF é obrigatório"),
  department: z.string().optional(),
  costCenter: z.string().optional()
});

export type AddEmployeeForm = z.infer<typeof addEmployeeSchema>;

export interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
}
