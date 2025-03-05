
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface DashboardHeaderProps {
  pendingGyms: number;
}

export function DashboardHeader({ pendingGyms }: DashboardHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Bem-vindo ao painel administrativo do TreinePass
          </p>
        </div>
      </div>
      
      {pendingGyms > 0 && (
        <Alert variant="destructive" className="animate-fadeIn">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Existem {pendingGyms} {pendingGyms === 1 ? 'academia pendente' : 'academias pendentes'} de aprovação.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
