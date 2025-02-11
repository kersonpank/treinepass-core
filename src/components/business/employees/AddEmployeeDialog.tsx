
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const addEmployeeSchema = z.object({
  email: z.string().email("Email inválido"),
  planId: z.string().uuid("Selecione um plano"),
  name: z.string().min(1, "Nome é obrigatório"),
  department: z.string().optional(),
  costCenter: z.string().optional()
});

type AddEmployeeForm = z.infer<typeof addEmployeeSchema>;

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
}

export function AddEmployeeDialog({ open, onOpenChange, businessId }: AddEmployeeDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddEmployeeForm>({
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

  const handleSubmit = async (data: AddEmployeeForm) => {
    setIsSubmitting(true);
    try {
      // First, create or get employee record
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .insert({
          business_id: businessId,
          email: data.email,
          full_name: data.name,
          department: data.department || null,
          cost_center: data.costCenter || null,
          status: "active"
        })
        .select()
        .single();

      if (employeeError) {
        if (employeeError.code === "23505") { // Unique constraint violation
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Este colaborador já está cadastrado."
          });
          return;
        }
        throw employeeError;
      }

      // Add employee benefit
      const { error: benefitError } = await supabase
        .from("employee_benefits")
        .insert({
          employee_id: employeeData.id,
          plan_id: data.planId,
          start_date: new Date().toISOString(),
          status: "active"
        });

      if (benefitError) throw benefitError;

      // Send invitation if user doesn't exist
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("email", data.email)
        .single();

      if (!existingProfile) {
        const { error: inviteError } = await supabase
          .from("employee_invites")
          .insert({
            business_id: businessId,
            plan_id: data.planId,
            email: data.email
          });

        if (inviteError) throw inviteError;

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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome do colaborador" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="colaborador@empresa.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Departamento (opcional)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="costCenter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Centro de Custo</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Centro de custo (opcional)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="planId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activePlans?.map((subscription) => (
                        <SelectItem 
                          key={subscription.plan_id} 
                          value={subscription.plan_id}
                        >
                          {subscription.benefit_plans.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => {
                  onOpenChange(false);
                  form.reset();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
