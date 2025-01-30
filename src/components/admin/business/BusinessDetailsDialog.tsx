import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Business } from "./types/business";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BusinessDetailsDialogProps {
  business: Business | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BusinessDetailsDialog({ business, open, onOpenChange }: BusinessDetailsDialogProps) {
  if (!business) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Detalhes da Empresa</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Informações Básicas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Razão Social</p>
                  <p>{business.company_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CNPJ</p>
                  <p>{business.cnpj}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={business.status === "active" ? "default" : "secondary"}>
                    {business.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Número de Funcionários</p>
                  <p>{business.number_of_employees}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Contato</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{business.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p>{business.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contato Principal</p>
                  <p>{business.contact_person}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cargo do Contato</p>
                  <p>{business.contact_position}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Endereço</h3>
              <p>{business.address}</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}