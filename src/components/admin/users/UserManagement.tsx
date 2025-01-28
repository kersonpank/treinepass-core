import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit2, Eye, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserType {
  type: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  cpf: string;
  created_at: string;
  user_types: UserType[];
  active: boolean;
}

export function UserManagement() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      // Primeiro buscar todos os perfis de usuário
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("*");

      if (profilesError) throw profilesError;

      // Depois buscar os tipos de cada usuário
      const usersWithTypes = await Promise.all(
        profiles.map(async (profile) => {
          const { data: types, error: typesError } = await supabase
            .from("user_types")
            .select("type")
            .eq("user_id", profile.id);

          if (typesError) throw typesError;

          return {
            ...profile,
            user_types: types || [],
          };
        })
      );

      return usersWithTypes as User[];
    },
  });

  const handleStatusChange = async (userId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ active })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Usuário ${active ? "ativado" : "desativado"} com sucesso`,
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

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const { error } = await supabase
        .from("user_profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso",
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

  const handleEditUser = async (userId: string, data: Partial<User>) => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: data.full_name,
          email: data.email,
          cpf: data.cpf,
          active: data.active,
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso",
      });

      refetch();
      setIsEditDialogOpen(false);
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
        <CardTitle>Gerenciamento de Usuários</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.cpf}</TableCell>
                  <TableCell>
                    {user.user_types.map((type) => (
                      <Badge key={type.type} className="mr-1">
                        {type.type}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.active ? "default" : "secondary"}>
                      {user.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-2">
                      {!user.active ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusChange(user.id, true)}
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusChange(user.id, false)}
                          className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user.id)}
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

      {selectedUser && (
        <>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Usuário</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleEditUser(selectedUser.id, {
                    full_name: formData.get("full_name") as string,
                    email: formData.get("email") as string,
                    cpf: formData.get("cpf") as string,
                    active: formData.get("active") === "true",
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    defaultValue={selectedUser.full_name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={selectedUser.email}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    defaultValue={selectedUser.cpf}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="active">Status</Label>
                  <Select
                    name="active"
                    defaultValue={selectedUser.active ? "true" : "false"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Ativo</SelectItem>
                      <SelectItem value="false">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Detalhes do Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Nome Completo</h4>
                  <p>{selectedUser.full_name}</p>
                </div>
                <div>
                  <h4 className="font-medium">Email</h4>
                  <p>{selectedUser.email}</p>
                </div>
                <div>
                  <h4 className="font-medium">CPF</h4>
                  <p>{selectedUser.cpf}</p>
                </div>
                <div>
                  <h4 className="font-medium">Tipos de Usuário</h4>
                  <div className="flex gap-1">
                    {selectedUser.user_types.map((type) => (
                      <Badge key={type.type}>{type.type}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">Status</h4>
                  <Badge variant={selectedUser.active ? "default" : "secondary"}>
                    {selectedUser.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium">Data de Cadastro</h4>
                  <p>
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </Card>
  );
}
