
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Trash } from "lucide-react";
import { useEffect, useState } from "react";

export function VolumeDiscountsForm() {
  const [nextId, setNextId] = useState(0);
  const { control, getValues } = useFormContext();
  
  // Use a separate field array name that's within your form schema
  const { fields, append, remove } = useFieldArray({
    control,
    name: "volumeDiscounts" as any, // Cast to any since it's not in the schema directly
  });

  // Initialize with one empty discount on first render if none exist
  useEffect(() => {
    if (fields.length === 0) {
      append({
        id: nextId,
        min_employees: 5, 
        max_employees: 10,
        discount_percentage: 5
      });
      setNextId(nextId + 1);
    }
  }, []);

  const handleAddDiscount = () => {
    // Get the last discount's values for better UX
    const lastDiscount = fields[fields.length - 1];
    let newMinEmployees = 5;
    let newMaxEmployees = 10;
    
    if (lastDiscount) {
      // Set new min to previous max + 1
      newMinEmployees = (lastDiscount.max_employees || 0) + 1;
      newMaxEmployees = newMinEmployees + 5; // Add 5 as a reasonable step
    }
    
    append({
      id: nextId,
      min_employees: newMinEmployees,
      max_employees: newMaxEmployees,
      discount_percentage: 5
    });
    setNextId(nextId + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Descontos por volume</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddDiscount}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar faixa
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-12 gap-4 items-end">
            <div className="col-span-3">
              <FormField
                control={control}
                name={`volumeDiscounts.${index}.min_employees`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mín. funcionários</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="5"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="col-span-3">
              <FormField
                control={control}
                name={`volumeDiscounts.${index}.max_employees`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máx. funcionários</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="10"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="col-span-4">
              <FormField
                control={control}
                name={`volumeDiscounts.${index}.discount_percentage`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="5"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="col-span-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-red-500 hover:text-red-700"
                onClick={() => fields.length > 1 && remove(index)}
                disabled={fields.length <= 1}
              >
                <Trash className="h-4 w-4" />
                <span className="sr-only">Remover</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
