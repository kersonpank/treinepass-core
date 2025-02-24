
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CheckInProcessingProps {
  userId: string;
  academiaId: string;
  qrCodeResult: string;
  onSuccess: (checkInId: string) => void;
  onError: (error: string) => void;
}

export function CheckInProcessing({ userId, academiaId, qrCodeResult, onSuccess, onError }: CheckInProcessingProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const processCheckIn = async () => {
      if (!qrCodeResult || isProcessing) return;
      setIsProcessing(true);

      try {
        // Validate QR Code
        const { data: qrCodeData, error: qrError } = await supabase
          .from("gym_qr_codes")
          .select("*")
          .eq("code", qrCodeResult)
          .eq("academia_id", academiaId)
          .single();

        if (qrError || !qrCodeData) {
          throw new Error("QR Code inválido ou expirado");
        }

        // Validate check-in rules
        const { data: validationResult, error: validationError } = await supabase
          .rpc('validate_check_in_rules', {
            p_user_id: userId,
            p_academia_id: academiaId
          });

        const validation = validationResult?.[0];
        if (validationError || !validation?.can_check_in) {
          throw new Error(validation?.message || "Check-in não permitido");
        }

        // Generate unique token for this check-in
        const token = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Register check-in
        const { data: checkInData, error: checkInError } = await supabase
          .from("gym_check_ins")
          .insert({
            user_id: userId,
            academia_id: academiaId,
            check_in_time: new Date().toISOString(),
            status: "pending",
            validation_method: "qrcode",
            validation_token: token,
            qr_code_id: qrCodeData.id,
            valor_repasse: validation.valor_repasse,
            plano_id: validation.plano_id
          })
          .select()
          .single();

        if (checkInError) throw checkInError;

        // Register financial record
        await supabase
          .from("gym_check_in_financial_records")
          .insert({
            check_in_id: checkInData.id,
            plan_id: validation.plano_id,
            valor_repasse: validation.valor_repasse,
            valor_plano: validation.valor_plano,
            status_pagamento: "pending",
            data_processamento: new Date().toISOString()
          });

        toast.success("Check-in registrado!", {
          description: `Seu token de validação é: ${token}. Apresente este token na academia.`,
          duration: 10000,
        });

        onSuccess(checkInData.id);
      } catch (error: any) {
        onError(error.message);
      } finally {
        setIsProcessing(false);
      }
    };

    processCheckIn();
  }, [qrCodeResult, academiaId, userId, onSuccess, onError]);

  return null;
}
