
import { CardHeader, CardTitle } from "@/components/ui/card";
import { CheckInHistoryItem } from "@/types/check-in";

interface CheckInSummaryProps {
  checkIns: CheckInHistoryItem[];
}

export function CheckInSummary({ checkIns }: CheckInSummaryProps) {
  const totalRepasse = checkIns?.reduce((sum, checkIn) => sum + (checkIn.valor_repasse || 0), 0) || 0;

  return (
    <CardHeader>
      <CardTitle>Histórico de Check-ins</CardTitle>
      <div className="text-sm text-muted-foreground">
        Valor total de repasse: R$ {totalRepasse.toFixed(2)}
      </div>
    </CardHeader>
  );
}
