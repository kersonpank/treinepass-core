
import { PaymentHistoryList } from "./PaymentHistoryList";

interface FinancialPanelProps {
  academiaId: string;
}

export function FinancialPanel({ academiaId }: FinancialPanelProps) {
  return (
    <div className="space-y-8">
      <PaymentHistoryList academiaId={academiaId} />
    </div>
  );
}
