import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PaymentFormProps {
  onSubmit: (data: CustomerFormData) => void;
  initialData?: Partial<CustomerFormData>;
  loading?: boolean;
}

export interface CustomerFormData {
  name: string;
  cpfCnpj: string;
  email: string;
  phone: string;
  address: string;
  addressNumber: string;
  province: string;
  postalCode: string;
}

export function PaymentForm({ onSubmit, initialData = {}, loading }: PaymentFormProps) {
  const [form, setForm] = useState<CustomerFormData>({
    name: initialData.name || "",
    cpfCnpj: initialData.cpfCnpj || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    address: initialData.address || "",
    addressNumber: initialData.addressNumber || "",
    province: initialData.province || "",
    postalCode: initialData.postalCode || "",
  });
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validateCep(cep: string) {
    return /^\d{8}$/.test(cep) && cep !== "00000000";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateCep(form.postalCode)) {
      setError("Informe um CEP válido (apenas números, 8 dígitos).");
      return;
    }
    setError(null);
    onSubmit(form);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-2">
        <input name="name" value={form.name} onChange={handleChange} required placeholder="Nome completo" className="input" />
        <input name="cpfCnpj" value={form.cpfCnpj} onChange={handleChange} required placeholder="CPF ou CNPJ" className="input" />
        <input name="email" value={form.email} onChange={handleChange} required placeholder="E-mail" className="input col-span-2" />
        <input name="phone" value={form.phone} onChange={handleChange} required placeholder="Telefone" className="input col-span-2" />
        <input name="address" value={form.address} onChange={handleChange} required placeholder="Endereço" className="input col-span-2" />
        <input name="addressNumber" value={form.addressNumber} onChange={handleChange} required placeholder="Número" className="input" />
        <input name="province" value={form.province} onChange={handleChange} required placeholder="Bairro" className="input" />
        <input name="postalCode" value={form.postalCode} onChange={handleChange} required placeholder="CEP (somente números)" className="input col-span-2" maxLength={8} />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Processando..." : "Pagar"}
      </Button>
    </form>
  );
}
