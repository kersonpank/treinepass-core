
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
  onSuccess: (checkInData: any) => void;
  method: 'qr_code' | 'access_token';
}

interface CheckInLimits {
  remainingDaily: number | null;
  remainingWeekly: number | null;
  remainingMonthly: number | null;
}

export function ManualCheckIn({ academiaId, onSuccess, method }: ManualCheckInProps) {
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showNoPlanDialog, setShowNoPlanDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkInLimits, setCheckInLimits] = useState<CheckInLimits | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds
  const { toast } = useToast();

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

        // Gerar novo token e armazenar no banco
        const newToken = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiresAt = new Date(Date.now() + 1200000); // 20 minutes

        const { error: insertError } = await supabase
          .from('gym_check_ins')
          .insert({
            user_id: user.id,
            academia_id: academiaId,
            validation_method: method,
            access_token: newToken,
            token_expires_at: expiresAt.toISOString(),
            status: 'active'
          });

        if (insertError) {
          throw insertError;
        }

        setAccessCode(newToken);
        setTimeLeft(1200);
        console.log("Novo token gerado:", newToken);
      }
    } catch (error: any) {
      console.error("Erro ao gerar token:", error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar código",
        description: error.message,
      });
    }
  };

  // Access code generation and refresh
  useEffect(() => {
    if (showCheckInDialog) {
      generateAccessCode();
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
        onScan={() => {}}
      />

      <NoPlanDialog
        open={showNoPlanDialog}
        onOpenChange={setShowNoPlanDialog}
      />
    </>
  );
}
