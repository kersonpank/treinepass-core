
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users } from "lucide-react";
import type { Gym } from "@/types/gym";

interface GymMetricsCardsProps {
  gyms: Gym[] | undefined;
}

export function GymMetricsCards({ gyms }: GymMetricsCardsProps) {
  return (
    <div className="grid gap-4 mb-8 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Academias
          </CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {gyms?.length || 0}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Academias Pendentes
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {gyms?.filter(gym => gym.status === "pendente").length || 0}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
