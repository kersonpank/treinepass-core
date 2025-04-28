
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2 } from "lucide-react";

interface CreditCardFormProps {
  onSubmit: (formData: CreditCardFormData) => void;
  loading?: boolean;
  errorMessage?: string | null;
}

export interface CreditCardFormData {
  holderName: string;
  cardNumber: string;
  expirationMonth: string;
  expirationYear: string;
  ccv: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
}

export function CreditCardForm({ onSubmit, loading = false, errorMessage = null }: CreditCardFormProps) {
  const [formData, setFormData] = useState<CreditCardFormData>({
    holderName: "",
    cardNumber: "",
    expirationMonth: "",
    expirationYear: "",
    ccv: "",
    cpfCnpj: "",
    postalCode: "",
    addressNumber: "",
    phone: ""
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreditCardFormData, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    
    // Format card number with spaces
    if (name === "cardNumber") {
      formattedValue = value.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
    }
    
    // Format expiration date
    if (name === "expirationMonth" && value.length > 2) {
      formattedValue = value.slice(0, 2);
    }
    if (name === "expirationYear" && value.length > 2) {
      formattedValue = value.slice(0, 2);
    }
    
    // Format CCV
    if (name === "ccv" && value.length > 4) {
      formattedValue = value.slice(0, 4);
    }
    
    // Clear errors when typing
    setErrors(prev => ({
      ...prev,
      [name]: undefined
    }));
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreditCardFormData, string>> = {};
    
    if (!formData.holderName) newErrors.holderName = "Nome é obrigatório";
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, "").length < 13) {
      newErrors.cardNumber = "Número do cartão inválido";
    }
    if (!formData.expirationMonth || parseInt(formData.expirationMonth) < 1 || parseInt(formData.expirationMonth) > 12) {
      newErrors.expirationMonth = "Mês inválido";
    }
    if (!formData.expirationYear) newErrors.expirationYear = "Ano inválido";
    if (!formData.ccv) newErrors.ccv = "CCV é obrigatório";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="holderName">Nome no cartão</Label>
        <Input
          id="holderName"
          name="holderName"
          value={formData.holderName}
          onChange={handleChange}
          placeholder="Nome como aparece no cartão"
          autoComplete="cc-name"
          className={errors.holderName ? "border-destructive" : ""}
        />
        {errors.holderName && <p className="text-xs text-destructive">{errors.holderName}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="cardNumber">Número do cartão</Label>
        <Input
          id="cardNumber"
          name="cardNumber"
          value={formData.cardNumber}
          onChange={handleChange}
          placeholder="1234 5678 9012 3456"
          autoComplete="cc-number"
          className={errors.cardNumber ? "border-destructive" : ""}
        />
        {errors.cardNumber && <p className="text-xs text-destructive">{errors.cardNumber}</p>}
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expirationMonth">Mês</Label>
          <Input
            id="expirationMonth"
            name="expirationMonth"
            value={formData.expirationMonth}
            onChange={handleChange}
            placeholder="MM"
            autoComplete="cc-exp-month"
            className={errors.expirationMonth ? "border-destructive" : ""}
          />
          {errors.expirationMonth && <p className="text-xs text-destructive">{errors.expirationMonth}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="expirationYear">Ano</Label>
          <Input
            id="expirationYear"
            name="expirationYear"
            value={formData.expirationYear}
            onChange={handleChange}
            placeholder="YY"
            autoComplete="cc-exp-year"
            className={errors.expirationYear ? "border-destructive" : ""}
          />
          {errors.expirationYear && <p className="text-xs text-destructive">{errors.expirationYear}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ccv">CVC</Label>
          <Input
            id="ccv"
            name="ccv"
            value={formData.ccv}
            onChange={handleChange}
            placeholder="123"
            autoComplete="cc-csc"
            className={errors.ccv ? "border-destructive" : ""}
          />
          {errors.ccv && <p className="text-xs text-destructive">{errors.ccv}</p>}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
        <Input
          id="cpfCnpj"
          name="cpfCnpj"
          value={formData.cpfCnpj}
          onChange={handleChange}
          placeholder="Apenas números"
          className={errors.cpfCnpj ? "border-destructive" : ""}
        />
        {errors.cpfCnpj && <p className="text-xs text-destructive">{errors.cpfCnpj}</p>}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postalCode">CEP</Label>
          <Input
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            placeholder="00000-000"
            className={errors.postalCode ? "border-destructive" : ""}
          />
          {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="addressNumber">Número</Label>
          <Input
            id="addressNumber"
            name="addressNumber"
            value={formData.addressNumber}
            onChange={handleChange}
            placeholder="123"
            className={errors.addressNumber ? "border-destructive" : ""}
          />
          {errors.addressNumber && <p className="text-xs text-destructive">{errors.addressNumber}</p>}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="(00) 00000-0000"
          className={errors.phone ? "border-destructive" : ""}
        />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
      </div>
      
      {errorMessage && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md">
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}
      
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pagar com Cartão
          </>
        )}
      </Button>
    </form>
  );
}
