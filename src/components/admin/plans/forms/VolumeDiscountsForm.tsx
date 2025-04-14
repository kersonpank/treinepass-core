
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { PlanFormValues } from "../types/plan";
import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface VolumeDiscountsFormProps {
  form: UseFormReturn<PlanFormValues>;
  planId?: string;
}

// Define a type for the volume discount
interface VolumeDiscount {
  id: string;
  plan_id: string;
  min_employees: number;
  max_employees?: number;
  discount_percentage: number;
}

export function VolumeDiscountsForm({ form, planId }: VolumeDiscountsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: volumeDiscounts, refetch } = useQuery({
    queryKey: ["volume-discounts", planId],
    queryFn: async () => {
      if (!planId) return [];
      
      const { data, error } = await supabase
        .from("plan_volume_discounts")
        .select("*")
        .eq("plan_id", planId)
        .order("min_employees", { ascending: true });

      if (error) throw error;
      return data as VolumeDiscount[];
    },
    enabled: !!planId
  });

  const handleAddDiscount = async () => {
    if (!planId) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("plan_volume_discounts")
        .insert({
          plan_id: planId,
          min_employees: 1,
          discount_percentage: 0,
        });

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error("Error adding volume discount:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!planId) return;
    
    try {
      const { error } = await supabase
        .from("plan_volume_discounts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error("Error deleting volume discount:", error);
    }
  };

  // Register form fields for each discount
  if (volumeDiscounts && volumeDiscounts.length > 0) {
    volumeDiscounts.forEach(discount => {
      // Register fields for dynamic names - using a custom property in the form that's not part of the main schema
      if (!form.getValues(`volume_discounts.${discount.id}`)) {
        form.setValue(`volume_discounts.${discount.id}.min_employees` as any, discount.min_employees);
        form.setValue(`volume_discounts.${discount.id}.max_employees` as any, discount.max_employees || undefined);
        form.setValue(`volume_discounts.${discount.id}.discount_percentage` as any, discount.discount_percentage);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Descontos por Volume</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddDiscount}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          <span className="ml-2">Adicionar Desconto</span>
        </Button>
      </div>

      <div className="space-y-4">
        {volumeDiscounts?.map((discount) => (
          <div key={discount.id} className="flex items-end gap-4">
            <div className="flex-1">
              <FormLabel>Mínimo de Funcionários</FormLabel>
              <Input
                type="number"
                min="1"
                value={discount.min_employees}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  // Update the discount in the database
                  supabase
                    .from("plan_volume_discounts")
                    .update({ min_employees: value })
                    .eq("id", discount.id)
                    .then(() => refetch());
                }}
              />
            </div>

            <div className="flex-1">
              <FormLabel>Máximo de Funcionários</FormLabel>
              <Input
                type="number"
                min="1"
                value={discount.max_employees || ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : null;
                  // Update the discount in the database
                  supabase
                    .from("plan_volume_discounts")
                    .update({ max_employees: value })
                    .eq("id", discount.id)
                    .then(() => refetch());
                }}
              />
            </div>

            <div className="flex-1">
              <FormLabel>Desconto (%)</FormLabel>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={discount.discount_percentage}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  // Update the discount in the database
                  supabase
                    .from("plan_volume_discounts")
                    .update({ discount_percentage: value })
                    .eq("id", discount.id)
                    .then(() => refetch());
                }}
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mb-2"
              onClick={() => handleDeleteDiscount(discount.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
