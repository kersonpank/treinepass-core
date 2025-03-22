<<<<<<< HEAD

import { useEffect } from "react";
=======
import { useState, useEffect } from "react";
>>>>>>> main
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeGenerator } from "./components/QRCodeGenerator";
import { TokenValidator } from "./components/TokenValidator";

export function ValidateCheckIn() {
  const { id: academiaId } = useParams();
  const { toast } = useToast();

  useEffect(() => {
    if (!academiaId) return;

    // Subscribe to real-time check-ins
    const channel = supabase
      .channel('public:gym_check_ins')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gym_check_ins',
          filter: `academia_id=eq.${academiaId}`
        },
        (payload) => {
          // Show a toast for new check-ins
          toast({
            title: "Novo check-in registrado",
            description: "Um novo check-in foi registrado com sucesso!",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [academiaId, toast]);

<<<<<<< HEAD
  if (!academiaId) {
    return <div>ID da academia não encontrado</div>;
  }
=======
  const generateQRCode = async () => {
    if (!academiaId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "ID da academia não encontrado",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Generate random code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      const { error } = await supabase
        .from("gym_qr_codes")
        .insert({
          code,
          academia_id: academiaId,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      setQrCode(code);
      toast({
        title: "QR Code gerado",
        description: "Novo QR Code gerado com sucesso!",
      });

      // Auto-expire after 5 minutes
      setTimeout(() => {
        setQrCode(null);
        setValidationResult(null);
      }, 5 * 60 * 1000);

    } catch (error: any) {
      console.error("Erro ao gerar QR code:", error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar QR Code",
        description: "Não foi possível gerar o QR Code. Tente novamente.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const validateAccessToken = async () => {
    if (!academiaId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "ID da academia não encontrado",
      });
      return;
    }

    if (!accessToken.trim()) {
      toast({
        variant: "destructive",
        title: "Token inválido",
        description: "Por favor, insira um token de acesso.",
      });
      return;
    }

    setIsValidating(true);
    try {
      // Buscar check-in pendente pelo token de validação
      const { data: checkInData, error: checkInError } = await supabase
        .from("gym_check_ins")
        .select(`
          *,
          user:user_id (
            id,
            full_name,
            email
          ),
          plano:plano_id (
            id,
            name,
            plan_type
          )
        `)
        .eq("validation_token", accessToken)
        .eq("academia_id", academiaId)
        .eq("status", "pending")
        .single();

      if (checkInError || !checkInData) {
        throw new Error("Token inválido ou expirado");
      }

      // Atualizar status do check-in
      const { error: updateError } = await supabase
        .from("gym_check_ins")
        .update({
          status: "active",
          validated_at: new Date().toISOString()
        })
        .eq("id", checkInData.id);

      if (updateError) throw updateError;

      // Atualizar registro financeiro
      await supabase
        .from("gym_check_in_financial_records")
        .update({
          status_pagamento: "processed",
          data_processamento: new Date().toISOString()
        })
        .eq("check_in_id", checkInData.id);

      setValidationResult({
        success: true,
        message: "Check-in validado com sucesso",
        userName: checkInData.user.full_name
      });

      toast({
        title: "Check-in validado!",
        description: `Check-in confirmado para ${checkInData.user.full_name}`,
      });

    } catch (error: any) {
      console.error("Erro ao validar token:", error);
      setValidationResult({
        success: false,
        message: error.message || "Erro ao validar token",
      });
      toast({
        variant: "destructive",
        title: "Erro na validação",
        description: error.message || "Não foi possível validar o token. Tente novamente.",
      });
    } finally {
      setIsValidating(false);
    }
  };
>>>>>>> main

  return (
    <div className="space-y-4">
      <Tabs defaultValue="qrcode" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="qrcode">QR Code</TabsTrigger>
          <TabsTrigger value="token">Token de Acesso</TabsTrigger>
        </TabsList>

        <TabsContent value="qrcode">
          <QRCodeGenerator academiaId={academiaId} />
        </TabsContent>

        <TabsContent value="token">
          <TokenValidator academiaId={academiaId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
