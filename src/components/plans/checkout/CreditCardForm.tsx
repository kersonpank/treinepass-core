import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CreditCardFormProps {
  onSubmit: (formData: CreditCardFormData) => Promise<void>;
  onCancel: () => void;
  planName: string;
  planPrice: number;
  processing: boolean;
}

export interface CreditCardFormData {
  holderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export function CreditCardForm({ onSubmit, onCancel, planName, planPrice, processing }: CreditCardFormProps) {
  const [formData, setFormData] = useState<CreditCardFormData>({
    holderName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof CreditCardFormData, string>>>({});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Formatação em tempo real dos campos
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\D/g, '').substring(0, 16);
      // Adicionar espaços a cada 4 dígitos para visualização
      formattedValue = formattedValue.replace(/(.{4})/g, '$1 ').trim();
    } else if (name === 'expiryMonth') {
      formattedValue = value.replace(/\D/g, '').substring(0, 2);
      // Limitar o mês entre 1 e 12
      if (formattedValue && parseInt(formattedValue) > 12) {
        formattedValue = '12';
      }
    } else if (name === 'expiryYear') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
      // Garantir que o ano não seja no passado
      const currentYear = new Date().getFullYear();
      if (formattedValue && formattedValue.length === 4 && parseInt(formattedValue) < currentYear) {
        formattedValue = currentYear.toString();
      }
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 3);
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    // Limpar erro quando o usuário digita
    if (errors[name as keyof CreditCardFormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors: Partial<Record<keyof CreditCardFormData, string>> = {};
    
    if (!formData.holderName.trim()) {
      newErrors.holderName = 'Nome é obrigatório';
    }
    
    if (!formData.cardNumber.replace(/\s/g, '').trim() || formData.cardNumber.replace(/\s/g, '').length < 16) {
      newErrors.cardNumber = 'Número do cartão inválido';
    }
    
    if (!formData.expiryMonth) {
      newErrors.expiryMonth = 'Mês inválido';
    }
    
    if (!formData.expiryYear || formData.expiryYear.length < 4) {
      newErrors.expiryYear = 'Ano inválido';
    } else {
      // Verificar se a data não expirou
      const currentDate = new Date();
      const expiryDate = new Date(parseInt(formData.expiryYear), parseInt(formData.expiryMonth) - 1);
      
      if (expiryDate < currentDate) {
        newErrors.expiryYear = 'Cartão expirado';
      }
    }
    
    if (!formData.cvv || formData.cvv.length < 3) {
      newErrors.cvv = 'CVV inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Remover espaços do número do cartão antes de enviar
      const cleanedData = {
        ...formData,
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
      };
      
      onSubmit(cleanedData);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-slate-50 p-3 rounded-md border border-slate-100 mb-4">
        <h3 className="font-medium text-sm mb-2">Resumo da assinatura:</h3>
        <div className="flex justify-between">
          <p className="text-sm">{planName}</p>
          <p className="font-medium">{formatCurrency(planPrice)}</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="holderName">Nome no cartão</Label>
          <Input
            id="holderName"
            name="holderName"
            placeholder="Nome como aparece no cartão"
            value={formData.holderName}
            onChange={handleChange}
            className={errors.holderName ? "border-red-500" : ""}
            disabled={processing}
          />
          {errors.holderName && (
            <p className="text-xs text-red-500">{errors.holderName}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cardNumber">Número do cartão</Label>
          <div className="relative">
            <Input
              id="cardNumber"
              name="cardNumber"
              placeholder="0000 0000 0000 0000"
              value={formData.cardNumber}
              onChange={handleChange}
              className={`pl-10 ${errors.cardNumber ? "border-red-500" : ""}`}
              disabled={processing}
            />
            <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          {errors.cardNumber && (
            <p className="text-xs text-red-500">{errors.cardNumber}</p>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiryMonth">Mês</Label>
            <Input
              id="expiryMonth"
              name="expiryMonth"
              placeholder="MM"
              value={formData.expiryMonth}
              onChange={handleChange}
              className={errors.expiryMonth ? "border-red-500" : ""}
              disabled={processing}
            />
            {errors.expiryMonth && (
              <p className="text-xs text-red-500">{errors.expiryMonth}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expiryYear">Ano</Label>
            <Input
              id="expiryYear"
              name="expiryYear"
              placeholder="AAAA"
              value={formData.expiryYear}
              onChange={handleChange}
              className={errors.expiryYear ? "border-red-500" : ""}
              disabled={processing}
            />
            {errors.expiryYear && (
              <p className="text-xs text-red-500">{errors.expiryYear}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              name="cvv"
              placeholder="123"
              value={formData.cvv}
              onChange={handleChange}
              className={errors.cvv ? "border-red-500" : ""}
              disabled={processing}
            />
            {errors.cvv && (
              <p className="text-xs text-red-500">{errors.cvv}</p>
            )}
          </div>
        </div>
        
        <div className="pt-4 flex flex-col sm:flex-row gap-2">
          <Button 
            type="submit" 
            className="flex-1 flex items-center justify-center gap-2" 
            disabled={processing}
          >
            {processing ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                <span>Processando...</span>
              </>
            ) : (
              <span>Pagar agora</span>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
            disabled={processing}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
