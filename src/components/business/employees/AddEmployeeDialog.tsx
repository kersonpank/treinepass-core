
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddEmployeeForm } from "./AddEmployeeForm";
import { addEmployeeSchema, type AddEmployeeForm as AddEmployeeFormType, type AddEmployeeDialogProps } from "./types";
import { createEmployee, addEmployeeBenefit, checkExistingProfile, sendEmployeeInvite, sendInviteEmail } from "./employee.service";

export function AddEmployeeDialog({ open, onOpenChange, businessId }: AddEmployeeDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddEmployeeFormType>({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: {
      department: "",
      costCenter: ""
    }
  });

  const { data: activePlans } = useQuery({
    queryKey: ["businessPlans", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_plan_subscriptions")
        .select(`
          *,
          benefit_plans (*)
        `)
        .eq("business_id", businessId)
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
  });

  const { data: businessProfile } = useQuery({
    queryKey: ["businessProfile", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("id", businessId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (data: AddEmployeeFormType) => {
    setIsSubmitting(true);
    try {
      const employeeData = await createEmployee(data, businessId);
      await addEmployeeBenefit(employeeData.id, data.planId);

      const existingProfile = await checkExistingProfile(data.email);

      if (!existingProfile) {
        await sendEmployeeInvite(businessId, data.planId, data.email);
        
        // Send invite email
        if (businessProfile) {
          await sendInviteEmail(
            data.name,
            data.email,
            businessProfile.company_name
          );
        }

        toast({
          title: "Convite enviado",
          description: "Um email de convite foi enviado para o colaborador."
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Colaborador adicionado com sucesso!"
        });
      }

      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error("Error adding employee:", error);
      if (error.code === "23505") {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Este colaborador já está cadastrado."
        });
        return;
      }
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Colaborador</DialogTitle>
        </DialogHeader>
        <AddEmployeeForm
          form={form}
          activePlans={activePlans}
          isSubmitting={isSubmitting}
          onCancel={() => {
            onOpenChange(false);
            form.reset();
          }}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
