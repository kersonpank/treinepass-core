import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Business } from "./types/business";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BusinessEditDialogProps {
  business: Business | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BusinessEditDialog({ business, open, onOpenChange, onSuccess }: BusinessEditDialogProps) {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { isSubmitting }, setValue } = useForm<Business>();

  // Set form values when business data changes
  React.useEffect(() => {
    if (business) {
      setValue("company_name", business.company_name);
      setValue("email", business.email);
      setValue("phone", business.phone);
      setValue("address", business.address);
      setValue("number_of_employees", business.number_of_employees);
      setValue("contact_person", business.contact_person);
      setValue("contact_position", business.contact_position);
      setValue("status", business.status);
    }
  }, [business, setValue]);

  const onSubmit = async (data: Business) => {
    try {
      const { error } = await supabase
        .from("business_profiles")
        .update({
          company_name: data.company_name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          number_of_employees: data.number_of_employees,
          contact_person: data.contact_person,
          contact_position: data.contact_position,
          status: data.status
        })
        .eq("id", business?.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
  };

  if (!business) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Razão Social</Label>
              <Input id="company_name" {...register("company_name")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register("phone")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number_of_employees">Número de Funcionários</Label>
              <Input 
                id="number_of_employees" 
                type="number" 
                {...register("number_of_employees", { valueAsNumber: true })} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person">Contato Principal</Label>
              <Input id="contact_person" {...register("contact_person")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_position">Cargo do Contato</Label>
              <Input id="contact_position" {...register("contact_position")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                defaultValue={business.status}
                onValueChange={(value) => register("status").onChange({ target: { value } })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" {...register("address")} />
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}