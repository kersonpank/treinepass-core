
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Scanner } from "@yudiel/react-qr-scanner";

interface ManualCheckInProps {
  academiaId: string;
}

export function ManualCheckIn({ academiaId }: ManualCheckInProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [code, setCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
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
      </CardContent>
    </Card>
  );
}
