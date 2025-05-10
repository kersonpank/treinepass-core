
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AccessCodeGeneratorProps {
  academiaId: string;
  onSuccess: (code: string) => void;
}

export function AccessCodeGenerator({ academiaId, onSuccess }: AccessCodeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  const generateAccessCode = async () => {
    if (!academiaId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Academia não especificada",
      });
      return;
    }
    
    setIsGenerating(true);
    try {
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Usuário não autenticado",
        });
        return;
      }
      
      // Generate a random code (6 characters, uppercase letters and numbers)
      const code = Array(6)
        .fill(0)
        .map(() => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 36)))
        .join("");
      
      // Calculate expiration time (e.g., 15 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);
      
      // Save to database
      const { error } = await supabase
        .from('check_in_codes')
        .insert({
          code: code,
          user_id: user.id,
          academia_id: academiaId,
          status: 'active',
          expires_at: expiresAt.toISOString(), // Add this required field
        });
      
      if (error) {
        console.error("Error generating code:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível gerar o código de acesso",
        });
        return;
      }
      
      onSuccess(code);
    } catch (error) {
      console.error("Error in code generation:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao gerar o código de acesso",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={generateAccessCode} 
      disabled={isGenerating} 
      className="w-full"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Gerando...
        </>
      ) : (
        "Gerar Código de Acesso"
      )}
    </Button>
  );
}
