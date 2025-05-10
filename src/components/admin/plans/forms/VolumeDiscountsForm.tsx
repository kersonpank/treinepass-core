
import React, { useEffect } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, Trash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cuid } from "@/lib/utils";

export function VolumeDiscountsForm() {
  const form = useFormContext();
  const { fields, append, remove } = useFieldArray({
    name: "volume_discounts",
    control: form.control,
  });

  const addDiscount = () => {
    append({
      id: cuid(),
      min_employees: 10,
      max_employees: 50,
      discount_percentage: 5,
    });
  };

  useEffect(() => {
    // If no discounts exist, add a default one
    if (fields.length === 0) {
      addDiscount();
    }
  }, [fields.length]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Descontos por Volume</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addDiscount}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Faixa
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => {
          // Safe access using optional chaining and type checking
          const fieldValue = form.getValues(`volume_discounts.${index}`) || {};
          const maxEmployees = fieldValue.max_employees !== undefined ? 
                              fieldValue.max_employees : 
                              null;
          
          return (
            <Card key={field.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <FormField
                    control={form.control}
                    name={`volume_discounts.${index}.min_employees`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Mín. Funcionários</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`volume_discounts.${index}.max_employees`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Máx. Funcionários</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ilimitado"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value ? Number(value) : null);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`volume_discounts.${index}.discount_percentage`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Desconto (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-end mb-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground mt-2">
                  {maxEmployees
                    ? `${fieldValue.discount_percentage || 0}% de desconto para empresas com ${fieldValue.min_employees || 0} a ${maxEmployees} funcionários.`
                    : `${fieldValue.discount_percentage || 0}% de desconto para empresas com ${fieldValue.min_employees || 0} ou mais funcionários.`}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
