import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PlanRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: string;
  default_value: any;
}

interface PlanRulesConfigProps {
  value: Record<string, any>;
  onChange: (rules: Record<string, any>) => void;
  planId?: string;
}

export function PlanRulesConfig({ value, onChange, planId }: PlanRulesConfigProps) {
  const { toast } = useToast();

  const { data: rules } = useQuery({
    queryKey: ["plan-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_rules")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as PlanRule[];
    },
  });

  const handleRuleChange = (ruleId: string, ruleValue: any) => {
    onChange({
      ...value,
      [ruleId]: ruleValue,
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !planId) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${planId}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('plan-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('plan-images')
        .getPublicUrl(filePath);

      handleRuleChange('image', publicUrl);

      toast({
        title: "Imagem atualizada com sucesso",
        description: "A imagem do plano foi atualizada.",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Erro ao fazer upload da imagem",
        description: "Não foi possível fazer upload da imagem. Tente novamente.",
      });
    }
  };

  const renderRuleInput = (rule: PlanRule) => {
    switch (rule.rule_type) {
      case "numeric":
        return (
          <Input
            type="number"
            value={value[rule.id]?.limit || rule.default_value.limit}
            onChange={(e) =>
              handleRuleChange(rule.id, {
                limit: Number(e.target.value),
                period: value[rule.id]?.period || rule.default_value.period,
              })
            }
          />
        );
      case "schedule":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Início</Label>
              <Input
                type="time"
                value={value[rule.id]?.start || rule.default_value.start}
                onChange={(e) =>
                  handleRuleChange(rule.id, {
                    ...value[rule.id],
                    start: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Input
                type="time"
                value={value[rule.id]?.end || rule.default_value.end}
                onChange={(e) =>
                  handleRuleChange(rule.id, {
                    ...value[rule.id],
                    end: e.target.value,
                  })
                }
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {planId && (
        <Card>
          <CardHeader>
            <CardTitle>Imagem do Plano</CardTitle>
            <CardDescription>
              Faça upload de uma imagem para representar o plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {value.image && (
                <div className="relative w-24 h-24">
                  <img
                    src={value.image}
                    alt="Imagem do plano"
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              )}
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => document.getElementById('plan-image')?.click()}
              >
                <Upload className="w-4 h-4" />
                Upload
              </Button>
              <input
                id="plan-image"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {rules?.map((rule) => (
        <Card key={rule.id}>
          <CardHeader>
            <CardTitle>{rule.name}</CardTitle>
            <CardDescription>{rule.description}</CardDescription>
          </CardHeader>
          <CardContent>{renderRuleInput(rule)}</CardContent>
        </Card>
      ))}
    </div>
  );
}