import { Overview } from "@/components/dashboard/Overview";
import { UsageReports } from "@/components/dashboard/UsageReports";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="flex-1 space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription>
          Existem 3 academias pendentes de aprovação.
        </AlertDescription>
      </Alert>

      <Overview />
      
      <UsageReports />
    </div>
  );
}