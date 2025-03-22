
import React, { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreditCardFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreditCardData) => void;
  isLoading?: boolean;
}

interface CreditCardData {
  cardName: string;
  cardNumber: string;
  expiryDate: string;
  cvc: string;
  setAsDefault: boolean;
}

export function CreditCardForm({ isOpen, onClose, onSubmit, isLoading = false }: CreditCardFormProps) {
  const id = useId();
  const [formData, setFormData] = React.useState<CreditCardData>({
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    setAsDefault: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <div className="flex flex-col gap-2">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border"
            aria-hidden="true"
          >
            <Wallet className="opacity-80" size={16} strokeWidth={2} />
          </div>
          <DialogHeader>
            <DialogTitle className="text-left">Adicionar cartão de crédito</DialogTitle>
            <DialogDescription className="text-left">
              Preencha os dados do seu cartão para continuar.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`name-${id}`}>Nome no cartão</Label>
              <Input 
                id={`name-${id}`} 
                name="cardName"
                type="text" 
                required 
                value={formData.cardName}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`number-${id}`}>Número do cartão</Label>
              <div className="relative">
                <Input
                  id={`number-${id}`}
                  name="cardNumber"
                  className="peer pe-9"
                  required
                  maxLength={19}
                  value={formData.cardNumber}
                  onChange={handleChange}
                />
                <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80">
                  <CreditCard size={16} strokeWidth={2} aria-hidden="true" />
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`expiry-${id}`}>Data de validade</Label>
                <Input
                  id={`expiry-${id}`}
                  name="expiryDate"
                  required
                  placeholder="MM/AA"
                  maxLength={5}
                  value={formData.expiryDate}
                  onChange={handleChange}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor={`cvc-${id}`}>CVC</Label>
                <Input 
                  id={`cvc-${id}`}
                  name="cvc"
                  required
                  maxLength={4}
                  value={formData.cvc}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox 
              id={`primary-${id}`} 
              checked={formData.setAsDefault}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, setAsDefault: checked === true }))
              }
            />
            <Label htmlFor={`primary-${id}`} className="font-normal text-muted-foreground">
              Definir como método de pagamento padrão
            </Label>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Processando..." : "Confirmar pagamento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
