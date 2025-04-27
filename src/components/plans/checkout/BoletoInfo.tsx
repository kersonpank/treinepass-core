import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

interface BoletoInfoProps {
  digitableLine?: string;
  boletoUrl?: string;
  value: number;
  onCopy?: () => void;
}

export function BoletoInfo({ digitableLine, boletoUrl, value, onCopy }: BoletoInfoProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {digitableLine && (
        <div className="flex items-center space-x-2 w-full">
          <input
            type="text"
            value={digitableLine}
            readOnly
            className="flex-1 px-3 py-2 border rounded-md text-sm"
          />
          <Button variant="outline" size="icon" onClick={onCopy} title="Copiar linha digitável">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      )}
      {boletoUrl && (
        <Button asChild variant="outline" className="w-full">
          <a href={boletoUrl} target="_blank" rel="noopener noreferrer">
            Baixar Boleto
          </a>
        </Button>
      )}
      <p className="text-sm text-muted-foreground text-center">
        Após o pagamento, seu plano será ativado automaticamente.<br />
        Este processo pode levar alguns minutos.
      </p>
    </div>
  );
}
