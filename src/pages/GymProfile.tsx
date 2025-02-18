
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckInButton } from "@/components/mobile/check-in/CheckInButton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, MapPin, Phone } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@supabase/auth-helpers-react";

export function GymProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useAuth();

  const { data: gym, isLoading, error } = useQuery({
    queryKey: ["gym", id],
    queryFn: async () => {
      if (!id) throw new Error("ID da academia não fornecido");

      const { data, error } = await supabase
        .from("academias")
        .select(`
          *,
          academia_modalidades (
            modalidade:modalidades (
              id,
              nome
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const handleCheckInSuccess = (newCode: any) => {
    toast({
      title: "Check-in realizado!",
      description: "Você fez check-in com sucesso.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !gym) {
    toast({
      variant: "destructive",
      title: "Erro",
      description: "Não foi possível carregar os dados da academia.",
    });
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold">Academia não encontrada</h1>
        <Button onClick={() => navigate("/app")}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6 px-4">
      {/* Cabeçalho com nome e imagem */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{gym.nome}</h1>
        {gym.fotos && gym.fotos.length > 0 ? (
          <div className="relative w-full h-48 rounded-lg overflow-hidden">
            <img 
              src={gym.fotos[0]} 
              alt={gym.nome}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-200">
            <img 
              src="/placeholder-gym.jpg" 
              alt="Placeholder"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Informações principais */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              <span>{gym.endereco || "Endereço não informado"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-gray-500" />
              <span>{gym.telefone || "Telefone não informado"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <span>Horário de funcionamento disponível na academia</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modalidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {gym.academia_modalidades?.map((item: any) => (
                <Badge key={item.modalidade.id} variant="secondary">
                  {item.modalidade.nome}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão de Check-in */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          {user?.id ? (
            <CheckInButton
              academiaId={gym.id}
              userId={user.id}
              onSuccess={handleCheckInSuccess}
            />
          ) : (
            <Button onClick={() => navigate("/login")} className="w-full">
              Faça login para realizar check-in
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
