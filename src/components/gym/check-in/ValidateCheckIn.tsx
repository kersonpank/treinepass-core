
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Clock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFullName } from "@/lib/utils";

export function ValidateCheckIn() {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [academiaId, setAcademiaId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get the academia ID from the user's session
    const getAcademiaId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Usuário não autenticado.",
          });
          return;
        }
        
        // Get user's gym role
        const { data: gymRole, error: roleError } = await supabase
          .from('user_gym_roles')
          .select('gym_id')
          .eq('user_id', user.id)
          .eq('active', true)
          .single();
        
        if (roleError) {
          console.error("Erro ao buscar academia:", roleError);
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível determinar sua academia.",
          });
          return;
        }
        
        setAcademiaId(gymRole.gym_id);
      } catch (error) {
        console.error("Erro ao obter ID da academia:", error);
      }
    };
    
    getAcademiaId();
  }, [toast]);

  const validateCode = async () => {
    if (!code || !academiaId) return;
    
    setIsValidating(true);
    try {
      // First, find the check-in code
      const { data: checkInCode, error: codeError } = await supabase
        .from('check_in_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('academia_id', academiaId)
        .eq('status', 'active')
        .single();
      
      if (codeError || !checkInCode) {
        toast({
          variant: "destructive",
          title: "Código inválido",
          description: "O código informado não é válido ou já foi utilizado.",
        });
        setValidationResult({ success: false, message: "Código inválido" });
        return;
      }
      
      // Check if the code is expired
      if (new Date(checkInCode.expires_at) < new Date()) {
        toast({
          variant: "destructive",
          title: "Código expirado",
          description: "Este código de check-in já expirou.",
        });
        setValidationResult({ success: false, message: "Código expirado" });
        return;
      }
      
      // Get user info
      const { data: userInfo, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', checkInCode.user_id)
        .single();
      
      if (userError) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível encontrar informações do usuário.",
        });
        return;
      }
      
      // Mark code as used and register check-in
      const { error: updateError } = await supabase
        .from('check_in_codes')
        .update({ 
          status: 'used',
          used_at: new Date().toISOString()
        })
        .eq('id', checkInCode.id);
      
      if (updateError) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível validar o check-in.",
        });
        return;
      }
      
      // Register check-in in gym_check_ins table if it exists
      try {
        const { error: checkInError } = await supabase
          .from('gym_check_ins')
          .insert({
            user_id: checkInCode.user_id,
            academia_id: academiaId,
            check_in_code_id: checkInCode.id,
            validation_method: 'manual',
            check_in_time: new Date().toISOString(),
            status: 'used'
          });
        
        if (checkInError) console.error("Erro ao registrar check-in:", checkInError);
      } catch (err) {
        // Ignore errors if the table doesn't exist
        console.log("Aviso: não foi possível registrar check-in completo:", err);
      }

      // Set successful validation result
      setValidationResult({
        success: true,
        user: userInfo,
        checkInTime: new Date().toISOString(),
      });
      
      toast({
        title: "Check-in validado com sucesso",
        description: `Check-in realizado para ${userInfo.full_name}.`,
      });
      
    } catch (error: any) {
      console.error("Erro na validação do check-in:", error);
      toast({
        variant: "destructive",
        title: "Erro na validação",
        description: error.message || "Ocorreu um erro ao validar o check-in.",
      });
      setValidationResult({ success: false, message: "Erro na validação" });
    } finally {
      setIsValidating(false);
    }
  };

  const handleNewValidation = () => {
    setCode("");
    setValidationResult(null);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-center">Validar Check-in</CardTitle>
          <CardDescription className="text-center">
            Digite o código fornecido pelo usuário para validar o check-in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {validationResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                {validationResult.success ? (
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-10 w-10 text-green-500" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="h-10 w-10 text-red-500" />
                  </div>
                )}
              </div>
              
              {validationResult.success ? (
                <div className="text-center space-y-2">
                  <h3 className="font-bold text-xl">Check-in Validado!</h3>
                  <p>Nome: {formatFullName(validationResult.user.full_name)}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(validationResult.checkInTime).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="font-bold text-xl text-red-500">Código Inválido</h3>
                  <p className="text-sm text-muted-foreground">{validationResult.message}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {!academiaId ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <Input 
                    type="text" 
                    placeholder="Digite o código" 
                    value={code} 
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="text-center text-2xl tracking-widest"
                    maxLength={10}
                    disabled={isValidating}
                  />
                  <Button 
                    className="w-full" 
                    onClick={validateCode} 
                    disabled={!code || isValidating || code.length < 4}
                  >
                    {isValidating ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      "Validar Check-in"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
        
        {validationResult && (
          <CardFooter>
            <Button className="w-full" onClick={handleNewValidation}>
              Novo Check-in
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
