
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserMetrics } from "../hooks/useUserMetrics";

export function UserMetrics() {
  const { data: metrics } = useUserMetrics();

  return (
    <div className="grid gap-4 mb-8 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.total || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.active || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Usuários Inativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.inactive || 0}</div>
        </CardContent>
      </Card>
    </div>
  );
}
