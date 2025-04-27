import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { planFormSchema } from "./types/plan";
import { MultipleSelect, TTag } from "@/components/ui/multiple-select";
import * as z from 'zod';

type PlanFormValues = z.infer<typeof planFormSchema>;

interface CreatePlanFormProps {
  onSubmit: (values: PlanFormValues) => void;
  onCancel: () => void;
  tags: TTag[];
}

export function CreatePlanForm({ onSubmit, onCancel, tags }: CreatePlanFormProps) {
  const [selectedTags, setSelectedTags] = useState<TTag[]>([]);

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      description: "",
      monthly_cost: 0,
      annual_discount: 0,
      corporate_discount: 0,
      validity_period: 0,
      plan_type: "individual",
      period_type: "monthly",
      renewal_type: "automatic",
      rules: {
        treinos_por_semana: 3,
        acesso_app: true,
      },
      payment_rules: {
        continue_without_use: true,
      },
    },
    mode: "onChange",
  });

  const handleTagChange = (selected: TTag[]) => {
    setSelectedTags(selected);
  };

  const handleSubmit = (values: PlanFormValues) => {
    onSubmit({
      ...values,
      rules: {
        treinos_por_semana: values.rules?.treinos_por_semana || 0,
        acesso_app: values.rules?.acesso_app || false,
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="rules">Regras</TabsTrigger>
            <TabsTrigger value="payment">Pagamento</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do plano" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição do plano" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthly_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custo Mensal</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Custo mensal do plano" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="annual_discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desconto Anual (%)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Desconto para pagamento anual" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="corporate_discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desconto Corporativo (%)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Desconto para planos corporativos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="validity_period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período de Validade (dias)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Tempo de validade do plano em dias" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="plan_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Plano</FormLabel>
                  <FormControl>
                    <Input placeholder="Tipo de plano" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="period_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Período</FormLabel>
                  <FormControl>
                    <Input placeholder="Tipo de período" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="renewal_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Renovação</FormLabel>
                  <FormControl>
                    <Input placeholder="Tipo de renovação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardContent className="grid gap-4">
                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="rules.treinos_por_semana"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-right">Treinos por Semana</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Treinos por semana" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="rules.acesso_app"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-lg">Acesso ao App</FormLabel>
                          {/* <FormDescription>
                            Make it available to everyone.
                          </FormDescription> */}
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardContent className="grid gap-4">
                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="payment_rules.continue_without_use"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-lg">Continuar sem usar</FormLabel>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Criar Plano</Button>
        </div>
      </form>
    </Form>
  );
}
