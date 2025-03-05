import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeData: {
    image: string;
    code: string;
    value: number;
  };
}

export function QrCodeDialog({ open, onOpenChange, qrCodeData }: QrCodeDialogProps) {
  const { toast } = useToast();

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeData.code);
      toast({
        title: "Código copiado!",
        description: "Cole o código no seu aplicativo de pagamento.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao copiar código",
        description: "Tente copiar manualmente.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento PIX</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code ou copie o código PIX para realizar o pagamento de{" "}
            {formatCurrency(qrCodeData.value)}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-lg">
            <img
              src={qrCodeData.image}
              alt="QR Code PIX"
              className="w-64 h-64"
            />
          </div>
          <div className="flex items-center space-x-2 w-full">
            <input
              type="text"
              value={qrCodeData.code}
              readOnly
              className="flex-1 px-3 py-2 border rounded-md text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyCode}
              title="Copiar código PIX"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Após o pagamento, seu plano será ativado automaticamente.
            Este processo pode levar alguns minutos.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 