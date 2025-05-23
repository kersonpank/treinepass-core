import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Auto-open scan/token dialog without extra button
  useEffect(() => {
    setShowCheckInDialog(true);
  }, []);

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

      const { data: limitsData, error: limitsError } = await supabase.rpc('validate_check_in_rules', {
        p_user_id: user.id,
        p_academia_id: academiaId
      });

      if (limitsError) {
        console.error("Erro ao validar regras de check-in:", limitsError);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível verificar as regras de check-in",
        });
        return;
      }

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
      console.error("Erro ao gerar código:", error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar código",
        description: error.message,
      });
    }
  };

  const handleScanResult = async (result: string) => {
    console.log("QR Code escaneado:", result);
    if (result && !isProcessing) {
      setIsProcessing(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        // Validar QR Code
        const { data: qrCodeData, error: qrError } = await supabase
          .from("gym_qr_codes")
          .select("*")
          .eq("code", result)
          .eq("academia_id", academiaId)
          .eq("status", "active")
          .single();

        if (qrError || !qrCodeData) {
          throw new Error("QR Code inválido ou expirado");
        }

        // Validar regras de check-in
        const { data: validationResult, error: validationError } = await supabase
          .rpc('validate_check_in_rules', {
            p_user_id: user.id,
            p_academia_id: academiaId
          });

        if (validationError) {
          console.error("Erro ao validar regras:", validationError);
          throw new Error("Erro ao validar regras de check-in");
        }

        const validation = validationResult?.[0];
        if (!validation?.can_check_in) {
          throw new Error(validation?.message || "Check-in não permitido");
        }

        // Gerar token único para este check-in
        const token = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Registrar check-in
        const { data: checkInData, error: checkInError } = await supabase
          .from("gym_check_ins")
          .insert({
            user_id: user.id,
            academia_id: academiaId,
            check_in_time: new Date().toISOString(),
            status: "pending",
            validation_method: "qrcode",
            validation_token: token,
            qr_code_id: qrCodeData.id,
            valor_repasse: validation.valor_repasse || 0,
            plano_id: validation.plano_id
          })
          .select()
          .single();

        if (checkInError) {
          console.error("Erro ao registrar check-in:", checkInError);
          throw checkInError;
        }

        // Registrar histórico financeiro
        const { error: financialError } = await supabase
          .from("gym_check_in_financial_records")
          .insert({
            check_in_id: checkInData.id,
            plan_id: validation.plano_id,
            valor_repasse: validation.valor_repasse || 0,
            valor_plano: validation.valor_plano || 0,
            status_pagamento: "pending",
            data_processamento: new Date().toISOString()
          });

        if (financialError) {
          console.error("Erro ao registrar financeiro:", financialError);
          // Não falhar o processo por causa do financeiro
        }

        setShowCheckInDialog(false);
        toast({
          title: "Check-in registrado!",
          description: `Seu token de validação é: ${token}. Apresente este token na academia.`,
          duration: 10000,
        });

      } catch (error: any) {
        console.error("Erro ao realizar check-in:", error);
        toast({
          variant: "destructive",
          title: "Erro ao realizar check-in",
          description: error.message,
          duration: 5000,
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Check-in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CheckInDialog opens automatically on mount; no initial button needed */}
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
