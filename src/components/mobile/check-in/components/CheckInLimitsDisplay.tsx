
import { Badge } from "@/components/ui/badge";

interface CheckInLimits {
  remainingDaily: number | null;
  remainingWeekly: number | null;
  remainingMonthly: number | null;
}

interface CheckInLimitsDisplayProps {
  limits: CheckInLimits | null;
}

export function CheckInLimitsDisplay({ limits }: CheckInLimitsDisplayProps) {
  if (!limits) return null;

  return (
    <div className="space-y-2 mt-4">
      {limits.remainingDaily !== null && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Restantes hoje:</span>
          <Badge variant="secondary">{limits.remainingDaily}</Badge>
        </div>
      )}
      {limits.remainingWeekly !== null && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Restantes na semana:</span>
          <Badge variant="secondary">{limits.remainingWeekly}</Badge>
        </div>
      )}
      {limits.remainingMonthly !== null && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Restantes no mês:</span>
          <Badge variant="secondary">{limits.remainingMonthly}</Badge>
        </div>
      )}
    </div>
  );
}
