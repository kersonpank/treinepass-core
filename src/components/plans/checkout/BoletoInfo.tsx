
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Download, FileText } from "lucide-react";

interface BoletoInfoProps {
  digitableLine?: string;
  boletoUrl?: string;
  value: number;
  onCopy?: () => void;
}

export function BoletoInfo({ digitableLine, boletoUrl, value, onCopy }: BoletoInfoProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (digitableLine) {
      navigator.clipboard.writeText(digitableLine);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      if (onCopy) {
        onCopy();
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="text-center mb-2">
        <p className="font-medium">Boleto - R$ {value?.toFixed(2).replace('.', ',')}</p>
        <p className="text-sm text-muted-foreground">
          Copie o código de barras ou baixe o boleto para pagamento
        </p>
      </div>
      
      <div className="w-full flex items-center justify-center p-4">
        <FileText size={64} className="text-primary" />
      </div>
      
      {digitableLine && (
        <div className="w-full relative">
          <div className="p-3 bg-muted rounded-md text-xs overflow-x-auto whitespace-nowrap">
            {digitableLine}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            onClick={handleCopy}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </Button>
        </div>
      )}
      
      {boletoUrl && (
        <Button onClick={() => window.open(boletoUrl, "_blank")} className="gap-2">
          <Download size={16} />
          Baixar Boleto
        </Button>
      )}
      
      <p className="text-sm text-muted-foreground text-center mt-2">
        O boleto pode levar até 3 dias úteis para ser compensado após o pagamento.
      </p>
    </div>
  );
}
