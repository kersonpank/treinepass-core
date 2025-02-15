
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Business } from "./types/business";
import { BusinessDetailsDialog } from "./BusinessDetailsDialog";
import { BusinessEditDialog } from "./BusinessEditDialog";
import { ManagePlanSubscriptionDialog } from "./ManagePlanSubscriptionDialog";
import { BusinessTable } from "./BusinessTable";

export function BusinessManagement() {
  const { toast } = useToast();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);

  const { data: businesses, isLoading, refetch } = useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      const { data: businessData, error: businessError } = await supabase
        .from("business_profiles")
        .select(`
          *,
          user_plan_subscriptions (
            status,
            start_date,
            end_date
          ),
          employees (
            id,
            full_name,
            email,
            cpf,
            birth_date,
            department,
            cost_center,
            status
          )
        `)
        .order("created_at", { ascending: false });

      if (businessError) throw businessError;

      return businessData as Business[];
    },
  });

  const handleStatusChange = async (businessId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("business_profiles")
        .update({ status: newStatus })
        .eq("id", businessId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Status da empresa atualizado para ${newStatus}`,
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
  };

  const handleDelete = async (businessId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta empresa?")) return;

    try {
      const { error } = await supabase
        .from("business_profiles")
        .delete()
        .eq("id", businessId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Empresa excluída com sucesso",
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Empresas</CardTitle>
      </CardHeader>
      <CardContent>
        <BusinessTable
          businesses={businesses}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onView={(business) => {
            setSelectedBusiness(business);
            setIsViewDialogOpen(true);
          }}
          onEdit={(business) => {
            setSelectedBusiness(business);
            setIsEditDialogOpen(true);
          }}
          onPlanManage={(business) => {
            setSelectedBusiness(business);
            setIsPlanDialogOpen(true);
          }}
        />
      </CardContent>

      <BusinessDetailsDialog
        business={selectedBusiness}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />

      <BusinessEditDialog
        business={selectedBusiness}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={refetch}
      />

      <ManagePlanSubscriptionDialog
        business={selectedBusiness}
        open={isPlanDialogOpen}
        onOpenChange={setIsPlanDialogOpen}
        onSuccess={refetch}
      />
    </Card>
  );
}
