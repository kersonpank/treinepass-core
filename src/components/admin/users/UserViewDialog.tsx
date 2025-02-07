import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User } from "./types/user";

interface UserViewDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserViewDialog({ user, open, onOpenChange }: UserViewDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhes do Usuário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Nome Completo</h4>
            <p>{user.full_name}</p>
          </div>
          <div>
            <h4 className="font-medium">Email</h4>
            <p>{user.email}</p>
          </div>
          <div>
            <h4 className="font-medium">CPF</h4>
            <p>{user.cpf}</p>
          </div>
          <div>
            <h4 className="font-medium">Tipos de Usuário</h4>
            <div className="flex gap-1">
              {user.user_types.map((type) => (
                <Badge key={type.type}>{type.type}</Badge>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium">Status</h4>
            <Badge variant={user.active ? "default" : "secondary"}>
              {user.active ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <div>
            <h4 className="font-medium">Data de Cadastro</h4>
            <p>{new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}