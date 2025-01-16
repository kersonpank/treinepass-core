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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

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
}

export function PlanRulesConfig({ value, onChange }: PlanRulesConfigProps) {
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