import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Business {
  id: string;
  company_name: string;
  cnpj: string;
  email: string;
  phone: string;
  status: string;
  number_of_employees: number;
  industry?: string;
  contact_person: string;
  created_at: string;
}

export function BusinessManagement() {
  const { toast } = useToast();
  
  const { data: businesses, isLoading, refetch } = useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Business[];
    },
  });

  const handleStatusChange = async (businessId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("business_profiles")
        .update({ status: newStatus })
        .eq("id", businessId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Status da empresa atualizado para ${newStatus}`,
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
  };

  const handleDelete = async (businessId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta empresa?")) return;

    try {
      const { error } = await supabase
        .from("business_profiles")
        .delete()
        .eq("id", businessId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Empresa excluída com sucesso",
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Empresas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Funcionários</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses?.map((business) => (
                <TableRow key={business.id}>
                  <TableCell className="font-medium">
                    {business.company_name}
                  </TableCell>
                  <TableCell>{business.cnpj}</TableCell>
                  <TableCell>{business.email}</TableCell>
                  <TableCell>{business.number_of_employees}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        business.status === "active" 
                          ? "default" 
                          : business.status === "inactive" 
                            ? "secondary" 
                            : "outline"
                      }
                    >
                      {business.status === "active" ? "Ativo" : business.status === "inactive" ? "Inativo" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-2">
                      {business.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusChange(business.id, "active")}
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      {business.status === "active" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusChange(business.id, "inactive")}
                          className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {business.status === "inactive" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusChange(business.id, "active")}
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          // TODO: Implement edit functionality
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          // TODO: Implement view functionality
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(business.id)}
                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}