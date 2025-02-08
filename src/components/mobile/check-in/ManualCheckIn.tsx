import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckInLimitsDisplay } from "./components/CheckInLimitsDisplay";
import { NoPlanDialog } from "./components/NoPlanDialog";
import { CheckInDialog } from "./components/CheckInDialog";

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

        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        setAccessCode(code);
        setTimeLeft(1200);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar código",
        description: error.message,
      });
    }
  };

  const handleScanResult = async (result: string, method: 'qr_code' | 'token') => {
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

        // Log for debugging
        console.log("Scan result:", result);
        console.log("Academia ID:", academiaId);
        console.log("Validation method:", method);

        const { data, error } = await supabase.rpc('validate_gym_check_in', {
          p_user_id: user.id,
          p_academia_id: academiaId,
          p_qr_code: result,
          p_validation_method: method
        });

        if (error) {
          console.error("Check-in validation error:", error);
          throw error;
        }

        console.log("Check-in validation result:", data);
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
        console.error("Check-in error:", error);
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
            Fazer Check-in
          </Button>
          <CheckInLimitsDisplay limits={checkInLimits} />
        </CardContent>
      </Card>

      <CheckInDialog 
        open={showCheckInDialog}
        onOpenChange={setShowCheckInDialog}
        accessCode={accessCode}
        timeLeft={timeLeft}
        onScan={handleScanResult}
      />

      <NoPlanDialog
        open={showNoPlanDialog}
        onOpenChange={setShowNoPlanDialog}
      />
    </>
  );
}
