
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { CheckInCode } from "@/types/check-in";
import { CheckInButton } from "./check-in/CheckInButton";
import { CheckInDisplay } from "./check-in/CheckInDisplay";

export function DigitalCard() {
  const [activeCode, setActiveCode] = useState<CheckInCode | null>(null);
  const { academiaId } = useParams();

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: checkInCode, refetch: refetchCheckInCode } = useQuery({
    queryKey: ["activeCheckInCode", userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return null;

      // Verificar se há códigos de check-in ativos no banco de dados
      const currentTime = new Date().toISOString();
      const { data, error } = await supabase
        .from("check_in_codes")
        .select("*")
        .eq("user_id", userProfile.id)
        .eq("status", "active")
        .gt("expires_at", currentTime)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar código de check-in:", error);
        return null;
      }
      
      return data as CheckInCode | null;
    },
    enabled: !!userProfile?.id,
  });

  useEffect(() => {
    if (!checkInCode || checkInCode.status !== "active") {
      setActiveCode(null);
      return;
    }
    setActiveCode(checkInCode);
  }, [checkInCode]);

  const handleCheckInSuccess = (newCode: CheckInCode) => {
    setActiveCode(newCode);
    refetchCheckInCode();
  };

  const handleExpire = () => {
    setActiveCode(null);
    refetchCheckInCode();
  };

  if (!userProfile) {
    return null;
  }

  return (
    <div className="p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Carteirinha Digital</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">{userProfile.full_name}</h3>
            <p className="text-sm text-muted-foreground">CPF: {userProfile.cpf}</p>
          </div>

          {activeCode ? (
            <CheckInDisplay 
              checkInCode={activeCode} 
              onExpire={handleExpire}
            />
          ) : (
            academiaId && (
              <CheckInButton
                academiaId={academiaId}
                automatic={true}
                onSuccess={handleCheckInSuccess}
              />
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
