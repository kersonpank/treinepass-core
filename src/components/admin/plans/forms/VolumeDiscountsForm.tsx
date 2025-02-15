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
      return data;
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
            <FormField
              control={form.control}
              name={`volume_discounts.${discount.id}.min_employees`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Mínimo de Funcionários</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`volume_discounts.${discount.id}.max_employees`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Máximo de Funcionários</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`volume_discounts.${discount.id}.discount_percentage`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Desconto (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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