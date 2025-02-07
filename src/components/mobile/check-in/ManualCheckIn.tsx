
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
  const { toast } = useToast();

  useEffect(() => {
    const generateCode = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        toast({
          variant: "destructive",
          title: "Erro ao gerar código",
          description: "Não foi possível gerar o código de check-in",
        });
        return;
      }

      setCode(qrCode.code);
    };

    generateCode();
    const interval = setInterval(generateCode, 5 * 60 * 1000); // Regenerate every 5 minutes

    return () => clearInterval(interval);
  }, [academiaId, toast]);

  useEffect(() => {
    if (!code) return;

    const updateTimer = async () => {
      const { data: checkInCode } = await supabase
        .from("check_in_codes")
        .select("expires_at")
        .eq("code", code)
        .eq("status", "active")
        .maybeSingle();

      if (checkInCode) {
        const secondsLeft = differenceInSeconds(
          new Date(checkInCode.expires_at),
          new Date()
        );
        
        if (secondsLeft <= 0) {
          setTimeLeft(0);
          setCode(null);
        } else {
          setTimeLeft(secondsLeft);
        }
      }
    };

    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [code]);

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
                Expira em: {formatTimeLeft(timeLeft)}
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
