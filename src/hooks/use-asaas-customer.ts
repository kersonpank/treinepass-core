
import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { AsaasCustomer, CreateAsaasCustomerData } from '@/types/asaas';

export function useAsaasCustomer() {
  const queryClient = useQueryClient();

  // Buscar cliente existente
  const { data: customer, isLoading } = useQuery({
    queryKey: ['asaas-customer'],
    queryFn: async () => {
      const { data: { customer }, error } = await supabase.functions.invoke<{ 
        customer: AsaasCustomer 
      }>('asaas-customer/get');

      if (error) throw error;
      return customer;
    }
  });

  // Criar novo cliente
  const { mutate: createCustomer, isPending: isCreating } = useMutation({
    mutationFn: async (customerData: CreateAsaasCustomerData) => {
      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        customer: AsaasCustomer;
      }>('asaas-customer/create', {
        body: customerData
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Cliente criado com sucesso",
        description: "O cliente foi cadastrado no ASAAS"
      });
      queryClient.invalidateQueries({ queryKey: ['asaas-customer'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar cliente",
        description: error.message
      });
    }
  });

  return {
    customer,
    isLoading,
    createCustomer,
    isCreating
  };
}
