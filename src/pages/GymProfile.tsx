
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { CheckInDisplay } from "@/components/mobile/check-in/CheckInDisplay";
import { ManualCheckIn } from "@/components/mobile/check-in/ManualCheckIn";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function GymProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = useSession();
  const [activeCheckIn, setActiveCheckIn] = useState<any>(null);

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

  const handleCheckInSuccess = (checkInData: any) => {
    setActiveCheckIn(checkInData);
    toast({
      title: "Check-in realizado!",
      description: "Você fez check-in com sucesso.",
    });
  };

  const handleCheckInExpire = () => {
    setActiveCheckIn(null);
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

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold">Faça login para continuar</h1>
        <Button onClick={() => navigate("/login")}>
          Fazer Login
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{gym.nome}</h1>
      </div>

      {activeCheckIn ? (
        <CheckInDisplay 
          checkInCode={activeCheckIn}
          onExpire={handleCheckInExpire}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="qrcode" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qrcode">QR Code</TabsTrigger>
                <TabsTrigger value="manual">Código Manual</TabsTrigger>
              </TabsList>

              <TabsContent value="qrcode">
                <ManualCheckIn 
                  academiaId={id!}
                  onSuccess={handleCheckInSuccess}
                  method="qr_code"
                />
              </TabsContent>

              <TabsContent value="manual">
                <ManualCheckIn 
                  academiaId={id!}
                  onSuccess={handleCheckInSuccess}
                  method="access_token"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
