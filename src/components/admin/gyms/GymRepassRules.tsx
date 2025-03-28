import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GymRepassRule {
  id?: string;
  checkins_minimos: number;
  checkins_maximos?: number | null;
  valor_repasse: number;
}

interface GymRepassRulesProps {
  gymId: string;
  usaRegrasPersonalizadas: boolean;
  onToggleCustomRules: (value: boolean) => void;
}

export function GymRepassRules({ gymId, usaRegrasPersonalizadas, onToggleCustomRules }: GymRepassRulesProps) {
  const [rules, setRules] = useState<GymRepassRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadRules = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("regras_repasse")
        .select("*")
        .eq("academia_id", gymId)
        .eq("active", true)
        .order("checkins_minimos");

      if (error) throw error;
      setRules(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar regras de repasse",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addRule = () => {
    setRules([
      ...rules,
      {
        checkins_minimos: 1,
        checkins_maximos: null,
        valor_repasse: 0,
      },
    ]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: keyof GymRepassRule, value: any) => {
    const newRules = [...rules];
    newRules[index] = {
      ...newRules[index],
      [field]: value,
    };
    setRules(newRules);
  };

  const saveRules = async () => {
    try {
      setIsLoading(true);

      // Primeiro, desativa todas as regras existentes
      const { error: deleteError } = await supabase
        .from("regras_repasse")
        .update({ active: false })
        .eq("academia_id", gymId);

      if (deleteError) throw deleteError;

      // Depois, insere as novas regras
      if (rules.length > 0) {
        const { error: insertError } = await supabase
          .from("regras_repasse")
          .insert(
            rules.map(rule => ({
              academia_id: gymId,
              checkins_minimos: rule.checkins_minimos,
              checkins_maximos: rule.checkins_maximos,
              valor_repasse: rule.valor_repasse,
              active: true,
            }))
          );

        if (insertError) throw insertError;
      }

      toast({
        title: "Sucesso",
        description: "Regras de repasse atualizadas com sucesso",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="custom-rules">Usar regras personalizadas</Label>
          <p className="text-sm text-muted-foreground">
            Ative para definir valores de repasse específicos para esta academia
          </p>
        </div>
        <Switch
          id="custom-rules"
          checked={usaRegrasPersonalizadas}
          onCheckedChange={onToggleCustomRules}
        />
      </div>

      {usaRegrasPersonalizadas && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Regras de Repasse</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRule}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Regra
            </Button>
          </div>

          {rules.map((rule, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Check-ins Mínimos</Label>
                    <Input
                      type="number"
                      value={rule.checkins_minimos}
                      onChange={(e) =>
                        updateRule(index, "checkins_minimos", parseInt(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <Label>Check-ins Máximos</Label>
                    <Input
                      type="number"
                      value={rule.checkins_maximos || ""}
                      onChange={(e) =>
                        updateRule(
                          index,
                          "checkins_maximos",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      placeholder="Sem limite"
                    />
                  </div>
                  <div>
                    <Label>Valor de Repasse (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={rule.valor_repasse}
                      onChange={(e) =>
                        updateRule(index, "valor_repasse", parseFloat(e.target.value))
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRule(index)}
                      className="h-10 w-10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {rules.length > 0 && (
            <Button
              type="button"
              onClick={saveRules}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Salvando..." : "Salvar Regras"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}