import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import { CheckInCode } from "@/types/check-in";
import { format, differenceInSeconds } from "date-fns";

export function DigitalCard() {
  const [activeCode, setActiveCode] = useState<CheckInCode | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const { toast } = useToast();

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

  // Query to get active check-in code
  const { data: checkInCode, refetch: refetchCheckInCode } = useQuery({
    queryKey: ["activeCheckInCode", userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return null;

      const { data, error } = await supabase
        .from("check_in_codes")
        .select("*")
        .eq("user_id", userProfile.id)
        .eq("status", "active")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as CheckInCode | null;
    },
    enabled: !!userProfile?.id,
  });

  // Mutation to generate new check-in code
  const generateCheckInCode = useMutation({
    mutationFn: async (academiaId: string) => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      const qrData = {
        user_id: userProfile!.id,
        academia_id: academiaId,
        generated_at: new Date().toISOString(),
        code,
      };

      const { data, error } = await supabase
        .from("check_in_codes")
        .insert({
          user_id: userProfile!.id,
          academia_id: academiaId,
          code,
          qr_data: qrData,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setActiveCode(data);
      refetchCheckInCode();
      toast({
        title: "Check-in gerado com sucesso!",
        description: `Apresente o QR Code ou informe o código: ${data.code}`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao gerar check-in",
        description: "Por favor, tente novamente.",
      });
    },
  });

  // Update countdown timer
  useEffect(() => {
    if (!checkInCode || checkInCode.status !== "active") {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const secondsLeft = differenceInSeconds(
        new Date(checkInCode.expires_at),
        new Date()
      );

      if (secondsLeft <= 0) {
        setTimeLeft(0);
        refetchCheckInCode();
      } else {
        setTimeLeft(secondsLeft);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [checkInCode]);

  // Format time left
  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Carteirinha Digital</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {userProfile && (
            <>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">{userProfile.full_name}</h3>
                <p className="text-sm text-muted-foreground">CPF: {userProfile.cpf}</p>
              </div>
              
              {checkInCode && checkInCode.status === "active" && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <QRCodeSVG
                      value={JSON.stringify(checkInCode.qr_data)}
                      size={200}
                      level="H"
                      includeMargin
                      className="border-8 border-white rounded-lg shadow-lg"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-semibold">Código: {checkInCode.code}</p>
                    <p className="text-sm text-muted-foreground">
                      Apresente este QR Code ou informe o código acima
                    </p>
                    <p className="text-sm font-medium">
                      Expira em: {formatTimeLeft(timeLeft)}
                    </p>
                  </div>
                </div>
              )}
              
              {(!checkInCode || checkInCode.status !== "active") && (
                <div className="text-center">
                  <Button
                    onClick={() => generateCheckInCode.mutate("academia_id_here")}
                    disabled={generateCheckInCode.isPending}
                  >
                    Gerar Check-in
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}