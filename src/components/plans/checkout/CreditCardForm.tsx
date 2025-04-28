
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface CreditCardFormProps {
  value: number;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function CreditCardForm({ value, onSubmit, onCancel }: CreditCardFormProps) {
  const [formData, setFormData] = useState({
    cardNumber: "",
    holderName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="text-center mb-4">
        <p className="font-medium">Cartão de Crédito - R$ {value?.toFixed(2).replace('.', ',')}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Input
            name="cardNumber"
            placeholder="Número do Cartão"
            value={formData.cardNumber}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Input
            name="holderName"
            placeholder="Nome no Cartão"
            value={formData.holderName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Input
            name="expiryMonth"
            placeholder="Mês (MM)"
            value={formData.expiryMonth}
            onChange={handleChange}
            required
          />
          <Input
            name="expiryYear"
            placeholder="Ano (AA)"
            value={formData.expiryYear}
            onChange={handleChange}
            required
          />
          <Input
            name="cvv"
            placeholder="CVV"
            value={formData.cvv}
            onChange={handleChange}
            required
            maxLength={4}
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            "Pagar"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
      </form>
      
      <div className="text-xs text-center text-muted-foreground">
        O pagamento é processado em ambiente seguro.
      </div>
    </div>
  );
}
