
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Badge } from "@/components/ui/badge";

interface ManualCheckInProps {
  academiaId: string;
}

interface CheckInLimits {
  remainingDaily: number | null;
  remainingWeekly: number | null;
  remainingMonthly: number | null;
}

export function ManualCheckIn({ academiaId }: ManualCheckInProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [code, setCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkInLimits, setCheckInLimits] = useState<CheckInLimits | null>(null);
  const { toast } = useToast();

  const handleCheckIn = async (qrCode: string) => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Você precisa estar logado para fazer check-in",
        });
        return;
      }

      const { data, error } = await supabase.rpc('validate_gym_check_in', {
        p_user_id: user.id,
        p_academia_id: academiaId,
        p_qr_code: qrCode
      });

      if (error) throw error;

      const result = data[0];
      
      if (result.success) {
        // Get updated check-in limits after successful check-in
        const { data: limitsData } = await supabase.rpc('validate_check_in_rules', {
          p_user_id: user.id,
          p_academia_id: academiaId
        });

        if (limitsData?.[0]) {
          setCheckInLimits({
            remainingDaily: limitsData[0].remaining_daily,
            remainingWeekly: limitsData[0].remaining_weekly,
            remainingMonthly: limitsData[0].remaining_monthly
          });
        }

        toast({
          title: "Check-in realizado!",
          description: result.message,
        });
        setShowScanner(false);
        setCode("");
      } else {
        toast({
          variant: "destructive",
          title: "Erro no check-in",
          description: result.message,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao realizar check-in",
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanResult = (result: string) => {
    if (result && !isProcessing) {
      handleCheckIn(result);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code) {
      handleCheckIn(code);
    }
  };

  const renderLimits = () => {
    if (!checkInLimits) return null;

    return (
      <div className="space-y-2 mt-4">
        {checkInLimits.remainingDaily !== null && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Restantes hoje:</span>
            <Badge variant="secondary">{checkInLimits.remainingDaily}</Badge>
          </div>
        )}
        {checkInLimits.remainingWeekly !== null && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Restantes na semana:</span>
            <Badge variant="secondary">{checkInLimits.remainingWeekly}</Badge>
          </div>
        )}
        {checkInLimits.remainingMonthly !== null && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Restantes no mês:</span>
            <Badge variant="secondary">{checkInLimits.remainingMonthly}</Badge>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Check-in</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showScanner ? (
          <div className="space-y-4">
            <Scanner
              onDecode={handleScanResult}
              onError={(error) => {
                console.error(error);
                toast({
                  variant: "destructive",
                  title: "Erro no scanner",
                  description: "Não foi possível acessar a câmera",
                });
              }}
            />
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={() => setShowScanner(false)}
            >
              Cancelar Scanner
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button 
              className="w-full" 
              onClick={() => setShowScanner(true)}
              disabled={isProcessing}
            >
              Escanear QR Code
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  ou digite o código
                </span>
              </div>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <Input
                placeholder="Digite o código de check-in"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={!code || isProcessing}
              >
                Validar Código
              </Button>
            </form>
          </div>
        )}
        {renderLimits()}
      </CardContent>
    </Card>
  );
}
