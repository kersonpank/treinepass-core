
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { differenceInSeconds } from "date-fns";
import { CheckInCode } from "@/types/gym";

interface ManualCheckInProps {
  academiaId: string;
}

export function ManualCheckIn({ academiaId }: ManualCheckInProps) {
  const [code, setCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isConfirmed, setIsConfirmed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const generateCode = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar se o usuário pode fazer check-in
      const { data: validationResult, error: validationError } = await supabase
        .rpc('can_user_check_in', {
          p_user_id: user.id,
          p_academia_id: academiaId
        });

      if (validationError || !validationResult?.[0]?.can_check_in) {
        toast({
          variant: "destructive",
          title: "Check-in não permitido",
          description: validationResult?.[0]?.message || "Não foi possível validar o check-in",
        });
        return;
      }

      // Expire any existing active codes for this user and academia
      const { error: updateError } = await supabase
        .from("check_in_codes")
        .update({ status: 'expired' })
        .eq('user_id', user.id)
        .eq('academia_id', academiaId)
        .eq('status', 'active');

      if (updateError) {
        console.error('Error expiring existing codes:', updateError);
        return;
      }

      const qrCode = {
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        academia_id: academiaId,
      };

      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      const { error } = await supabase
        .from("check_in_codes")
        .insert({
          user_id: user.id,
          academia_id: academiaId,
          code: qrCode.code,
          qr_data: qrCode,
          expires_at: expiresAt.toISOString(),
          status: "active",
        });

      if (error) {
        console.error('Error generating new code:', error);
        toast({
          variant: "destructive",
          title: "Erro ao gerar código",
          description: "Não foi possível gerar o código de check-in",
        });
        return;
      }

      setCode(qrCode.code);
    };

    // Only generate new codes if check-in is not confirmed
    if (!isConfirmed) {
      generateCode();
      const interval = setInterval(generateCode, 5 * 60 * 1000); // Regenerate every 5 minutes
      return () => clearInterval(interval);
    }
  }, [academiaId, toast, isConfirmed]);

  useEffect(() => {
    if (!code || isConfirmed) return;

    const checkStatus = async () => {
      const { data: checkInCode } = await supabase
        .from("check_in_codes")
        .select("status, expires_at")
        .eq("code", code)
        .single();

      if (checkInCode?.status === "used") {
        setIsConfirmed(true);
        toast({
          title: "Check-in confirmado",
          description: "Seu check-in foi confirmado com sucesso!",
        });
        return;
      }

      if (checkInCode) {
        const secondsLeft = differenceInSeconds(
          new Date(checkInCode.expires_at),
          new Date()
        );
        
        if (secondsLeft <= 0) {
          setTimeLeft(0);
        } else {
          setTimeLeft(secondsLeft);
        }
      }
    };

    const timer = setInterval(checkStatus, 1000);
    return () => clearInterval(timer);
  }, [code, toast, isConfirmed]);

  // If check-in is confirmed, show success message
  if (isConfirmed) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="text-xl font-medium text-green-600">
              Check-in confirmado com sucesso!
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Check-in Manual</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="code" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code">Código</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold tracking-widest">
                {code || "------"}
              </div>
              <p className="text-sm text-muted-foreground">
                Apresente este código na recepção
              </p>
              <p className="text-sm font-medium">
                Novo código em: {formatTimeLeft(timeLeft)}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4">
            <div className="flex justify-center">
              {code && (
                <QRCodeSVG
                  value={JSON.stringify({
                    code,
                    academia_id: academiaId,
                  })}
                  size={200}
                  level="H"
                  includeMargin
                  className="border-8 border-white rounded-lg shadow-lg"
                />
              )}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Apresente este QR Code na recepção
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
