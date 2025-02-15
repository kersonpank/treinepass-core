
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "./types/user";

interface UserEditDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (userId: string, data: Partial<User>) => void;
}

export function UserEditDialog({
  user,
  open,
  onOpenChange,
  onSubmit,
}: UserEditDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            onSubmit(user.id, {
              full_name: formData.get("full_name") as string,
              email: formData.get("email") as string,
              cpf: formData.get("cpf") as string,
              phone_number: formData.get("phone_number") as string,
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
              defaultValue={user.full_name}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email}
              required
            />
          </div>
          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              name="cpf"
              defaultValue={user.cpf}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone_number">Celular</Label>
            <Input
              id="phone_number"
              name="phone_number"
              type="tel"
              defaultValue={user.phone_number || ''}
              placeholder="DDD + Número (ex: 11987654321)"
              pattern="^[1-9]{2}9[0-9]{8}$"
              title="Digite um número de celular válido com DDD (11 dígitos)"
            />
          </div>
          <div>
            <Label htmlFor="active">Status</Label>
            <Select
              name="active"
              defaultValue={user.active ? "true" : "false"}
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
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
