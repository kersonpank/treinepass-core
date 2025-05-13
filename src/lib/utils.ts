
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatCPF(cpf: string): string {
  // Remove non-numeric characters
  cpf = cpf.replace(/\D/g, '');
  
  // Format as XXX.XXX.XXX-XX
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

export function formatFullName(firstName: string, lastName: string): string {
  return [firstName, lastName]
    .filter(Boolean)
    .join(' ');
}

/**
 * Generate a unique ID (simple implementation)
 */
export function cuid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
