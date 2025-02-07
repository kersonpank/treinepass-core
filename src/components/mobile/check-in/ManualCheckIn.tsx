
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Badge } from "@/components/ui/badge";
import { X, AlertCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ManualCheckInProps {
  academiaId: string;
}

interface CheckInLimits {
  remainingDaily: number | null;
  remainingWeekly: number | null;
  remainingMonthly: number | null;
}

export function ManualCheckIn({ academiaId }: ManualCheckInProps) {
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showNoPlanDialog, setShowNoPlanDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkInLimits, setCheckInLimits] = useState<CheckInLimits | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds
  const { toast } = useToast();
  const navigate = useNavigate();

  // Access code generation and refresh
  useEffect(() => {
    if (showCheckInDialog) {
      generateAccessCode();
      setTimeLeft(1200); // Reset timer when dialog opens
      const interval = setInterval(generateAccessCode, 1200000); // 20 minutes
      return () => clearInterval(interval);
    }
  }, [showCheckInDialog]);

  // Timer countdown
  useEffect(() => {
    if (showCheckInDialog && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            generateAccessCode();
            return 1200;
          }
          return prevTime - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showCheckInDialog, timeLeft]);

  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const generateAccessCode = async () => {
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

      // Get updated check-in limits
      const { data: limitsData } = await supabase.rpc('validate_check_in_rules', {
        p_user_id: user.id,
        p_academia_id: academiaId
      });

      if (limitsData?.[0]) {
        if (!limitsData[0].can_check_in) {
          setShowCheckInDialog(false);
          setShowNoPlanDialog(true);
          return;
        }

        setCheckInLimits({
          remainingDaily: limitsData[0].remaining_daily,
          remainingWeekly: limitsData[0].remaining_weekly,
          remainingMonthly: limitsData[0].remaining_monthly
        });

        // Generate a random 6-digit code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        setAccessCode(code);
        setTimeLeft(1200); // Reset timer when new code is generated
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar código",
        description: error.message,
      });
    }
  };

  const handleScanResult = async (result: string) => {
    if (result && !isProcessing) {
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
          p_qr_code: result
        });

        if (error) throw error;

        const checkInResult = data[0];
        
        if (checkInResult.success) {
          toast({
            title: "Check-in realizado!",
            description: checkInResult.message,
          });
          setShowCheckInDialog(false);
        } else {
          if (checkInResult.message.includes("plano ativo")) {
            setShowCheckInDialog(false);
            setShowNoPlanDialog(true);
          } else {
            toast({
              variant: "destructive",
              title: "Erro no check-in",
              description: checkInResult.message,
            });
          }
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
    }
  };

  const handleCheckInClick = async () => {
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

      const { data: limitsData } = await supabase.rpc('validate_check_in_rules', {
        p_user_id: user.id,
        p_academia_id: academiaId
      });

      if (limitsData?.[0] && !limitsData[0].can_check_in) {
        setShowNoPlanDialog(true);
      } else {
        setShowCheckInDialog(true);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível verificar seu plano",
      });
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
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Check-in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full" 
            onClick={handleCheckInClick}
            disabled={isProcessing}
          >
            Realizar Check-in
          </Button>
          {renderLimits()}
        </CardContent>
      </Card>

      <AlertDialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="relative">
            <AlertDialogTitle>Check-in</AlertDialogTitle>
            <AlertDialogDescription>
              Escolha como deseja realizar o check-in
            </AlertDialogDescription>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0"
              onClick={() => setShowCheckInDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDialogHeader>
          <Tabs defaultValue="qrcode" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qrcode">QR Code</TabsTrigger>
              <TabsTrigger value="token">Token de Acesso</TabsTrigger>
            </TabsList>
            <TabsContent value="qrcode" className="mt-4">
              <div className="py-2">
                <Scanner
                  onResult={handleScanResult}
                  onError={(error) => {
                    console.error(error);
                    toast({
                      variant: "destructive",
                      title: "Erro no scanner",
                      description: "Não foi possível acessar a câmera",
                    });
                  }}
                />
                <p className="text-sm text-center text-muted-foreground mt-2">
                  Aponte a câmera para o QR Code da academia
                </p>
              </div>
            </TabsContent>
            <TabsContent value="token" className="mt-4">
              <div className="py-4 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Forneça este código para a academia:
                  </p>
                  <div className="text-3xl font-mono font-bold tracking-wider bg-muted p-4 rounded-lg">
                    {accessCode}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Este código expira em: {formatTimeLeft(timeLeft)}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCheckInDialog(false)}>
              Fechar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showNoPlanDialog} onOpenChange={setShowNoPlanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Plano Necessário
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você precisa ter um plano ativo para realizar check-in. 
              Que tal conhecer nossos planos disponíveis?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowNoPlanDialog(false);
                navigate('/app/plans');
              }}
              className="flex items-center gap-2"
            >
              Ver Planos
              <ArrowRight className="h-4 w-4" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
