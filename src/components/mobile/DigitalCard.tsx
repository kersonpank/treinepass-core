
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { CheckInButton } from "./check-in/CheckInButton";
import { CheckInCode } from "@/types/check-in";
import { formatDateTime } from "@/lib/utils";

interface DigitalCardProps {
  academiaId: string;
  academiaName: string;
}

export function DigitalCard({ academiaId, academiaName }: DigitalCardProps) {
  const { user } = useAuth();
  const [activeCode, setActiveCode] = useState<CheckInCode | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Buscar código ativo ou gerar um novo
  useEffect(() => {
    const fetchActiveCode = async () => {
      if (!user) return;

      try {
        // Verificar se existe a tabela check_in_codes
        const { count, error: tableCheckError } = await supabase
          .from("check_in_codes")
          .select("*", { count: 'exact', head: true });

        if (tableCheckError) {
          console.error("Erro ao verificar tabela check_in_codes:", tableCheckError);
          return;
        }

        // Buscar código ativo
        const { data, error } = await supabase
          .from("check_in_codes")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .eq("academia_id", academiaId)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          setActiveCode(data as CheckInCode);
        }
      } catch (error) {
        console.error("Erro ao buscar código:", error);
      }
    };

    fetchActiveCode();

    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchActiveCode, 10000);
    return () => clearInterval(interval);
  }, [user, academiaId]);

  // Atualizar contador de tempo restante
  useEffect(() => {
    if (!activeCode) return;

    const updateTimeLeft = () => {
      const now = new Date();
      const expiresAt = new Date(activeCode.expires_at);
      const diff = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      setTimeLeft(diff);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [activeCode]);

  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return "Expirado";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleNewCode = (newCode: CheckInCode) => {
    setActiveCode(newCode);
  };

  return (
    <Card className="w-full bg-white shadow-lg overflow-hidden">
      <CardContent className="p-6 flex flex-col items-center">
        <h3 className="text-xl font-semibold mb-2 text-center">
          {academiaName}
        </h3>
        
        {activeCode ? (
          <div className="w-full mt-4 flex flex-col items-center space-y-4">
            <div className="bg-muted p-4 w-full rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Código de Check-in</p>
              <p className="text-4xl font-bold tracking-widest">
                {activeCode.code}
              </p>
              <p className="text-sm mt-2">
                Expira em: <span className="font-medium">{formatTimeLeft(timeLeft)}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Gerado em: {formatDateTime(activeCode.created_at)}
              </p>
            </div>

            <div className="w-full text-center text-sm text-muted-foreground">
              <p>Apresente este código na recepção da academia</p>
            </div>
          </div>
        ) : (
          <div className="w-full mt-4 space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Gere um código para fazer check-in na academia
            </p>
            
            <CheckInButton 
              academiaId={academiaId} 
              onSuccess={handleNewCode} 
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
