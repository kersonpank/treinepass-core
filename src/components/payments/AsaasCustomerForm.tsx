
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAsaasCustomer } from "@/hooks/use-asaas-customer";
import type { CreateAsaasCustomerData } from "@/types/asaas";
import { cpf, cnpj } from 'cpf-cnpj-validator';

const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  cpfCnpj: z.string().refine((val) => {
    const value = val.replace(/\D/g, "");
    return value.length === 11 ? cpf.isValid(value) : cnpj.isValid(value);
  }, "CPF/CNPJ inválido"),
  phone: z.string().optional(),
  mobilePhone: z.string().optional(),
  address: z.string().optional(),
  addressNumber: z.string().optional(),
  complement: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional()
});

export function AsaasCustomerForm() {
  const { customer, isLoading, createCustomer, isCreating } = useAsaasCustomer();
  const form = useForm<CreateAsaasCustomerData>({
    resolver: zodResolver(formSchema)
  });

  const onSubmit = (data: CreateAsaasCustomerData) => {
    createCustomer(data);
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (customer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cliente ASAAS</CardTitle>
          <CardDescription>
            Seus dados já estão cadastrados no ASAAS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Nome</p>
              <p>{customer.name}</p>
            </div>
            <div>
              <p className="font-medium">E-mail</p>
              <p>{customer.email}</p>
            </div>
            <div>
              <p className="font-medium">CPF/CNPJ</p>
              <p>{customer.cpfCnpj}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastro ASAAS</CardTitle>
        <CardDescription>
          Precisamos de algumas informações para processar seus pagamentos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpfCnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF/CNPJ</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      onChange={(e) => {
                        // Remove tudo que não é número
                        const value = e.target.value.replace(/\D/g, "");
                        // Formata CPF ou CNPJ
                        if (value.length <= 11) {
                          e.target.value = value
                            .replace(/(\d{3})(\d)/, "$1.$2")
                            .replace(/(\d{3})(\d)/, "$1.$2")
                            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                        } else {
                          e.target.value = value
                            .replace(/^(\d{2})(\d)/, "$1.$2")
                            .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
                            .replace(/\.(\d{3})(\d)/, ".$1/$2")
                            .replace(/(\d{4})(\d)/, "$1-$2");
                        }
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone Fixo (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mobilePhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Celular (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
