import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CategoryRepassRulesProps {
  categoryId: string;
}

interface RepassRule {
  id: string;
  categoria_id: string;
  checkins_minimos: number;
  checkins_maximos: number | null;
  valor_repasse: number;
  active: boolean;
}

export function CategoryRepassRules({ categoryId }: CategoryRepassRulesProps) {
  const { toast } = useToast();
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRule, setNewRule] = useState({
    checkins_minimos: 0,
    checkins_maximos: null as number | null,
    valor_repasse: 0,
  });

  const { data: rules = [], refetch } = useQuery({
    queryKey: ["categoryRepassRules", categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regras_repasse_categoria")
        .select("*")
        .eq("categoria_id", categoryId)
        .eq("active", true)
        .order("checkins_minimos");

      if (error) throw error;
      return data as RepassRule[];
    },
  });

  const handleAddRule = async () => {
    try {
      const { error } = await supabase
        .from("regras_repasse_categoria")
        .insert({
          categoria_id: categoryId,
          ...newRule,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Regra adicionada com sucesso",
      });

      setIsAddingRule(false);
      setNewRule({
        checkins_minimos: 0,
        checkins_maximos: null,
        valor_repasse: 0,
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

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from("regras_repasse_categoria")
        .update({ active: false })
        .eq("id", ruleId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Regra removida com sucesso",
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Regras de Repasse</CardTitle>
        <Button onClick={() => setIsAddingRule(true)} disabled={isAddingRule}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </CardHeader>
      <CardContent>
        {isAddingRule && (
          <div className="space-y-4 mb-4 p-4 border rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Check-ins Mínimos</Label>
                <Input
                  type="number"
                  value={newRule.checkins_minimos}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      checkins_minimos: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Check-ins Máximos</Label>
                <Input
                  type="number"
                  value={newRule.checkins_maximos || ""}
                  placeholder="Sem limite"
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      checkins_maximos: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div>
                <Label>Valor de Repasse</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newRule.valor_repasse}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      valor_repasse: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingRule(false);
                  setNewRule({
                    checkins_minimos: 0,
                    checkins_maximos: null,
                    valor_repasse: 0,
                  });
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddRule}>Adicionar</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <span className="font-medium">
                  {rule.checkins_minimos}
                  {rule.checkins_maximos
                    ? ` - ${rule.checkins_maximos}`
                    : "+"}{" "}
                  check-ins
                </span>
                <span className="ml-4 text-muted-foreground">
                  {formatCurrency(rule.valor_repasse)} por check-in
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteRule(rule.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}