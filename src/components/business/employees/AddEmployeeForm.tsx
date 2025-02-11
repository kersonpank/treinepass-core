
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AddEmployeeForm } from "./types";

interface AddEmployeeFormProps {
  form: UseFormReturn<AddEmployeeForm>;
  activePlans: Array<{
    plan_id: string;
    benefit_plans: {
      name: string;
    };
  }> | undefined;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function AddEmployeeForm({ form, activePlans, isSubmitting, onCancel }: AddEmployeeFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit} className="space-y-4">
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
          name="cpf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  placeholder="000.000.000-00"
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .replace(/(\d{3})(\d)/, "$1.$2")
                      .replace(/(\d{3})(\d)/, "$1.$2")
                      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
                      .replace(/(-\d{2})\d+?$/, "$1");
                    field.onChange(value);
                  }}
                  maxLength={14}
                />
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
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adicionando..." : "Adicionar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
