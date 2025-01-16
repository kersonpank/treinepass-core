import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Gym {
  id: string;
  nome: string;
  endereco: string;
  status: string;
}

export function GymManagement() {
  const { data: gyms, isLoading } = useQuery({
    queryKey: ["userGyms"],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_gym_roles")
        .select("gym_id")
        .eq("role", "gym_owner")
        .eq("active", true);

      if (!roles?.length) return [];

      const { data: gyms } = await supabase
        .from("academias")
        .select("*")
        .in(
          "id",
          roles.map((r) => r.gym_id)
        );

      return gyms || [];
    },
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!gyms?.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Minhas Academias</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {gyms.map((gym) => (
          <Card key={gym.id}>
            <CardHeader>
              <CardTitle>{gym.nome}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">{gym.endereco}</p>
              <p className="text-sm text-gray-500">Status: {gym.status}</p>
              <Button
                className="mt-4"
                onClick={() => window.location.href = `/academia/${gym.id}`}
              >
                Gerenciar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}