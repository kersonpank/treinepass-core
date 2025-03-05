
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

interface CheckInConfirmationProps {
  checkInId: string;
  onConfirmed?: () => void;
  onError?: (error: string) => void;
}

export function CheckInConfirmation({
  checkInId,
  onConfirmed,
  onError
}: CheckInConfirmationProps) {
  const [status, setStatus] = useState<"pending" | "confirmed" | "error">("pending");
  const { toast } = useToast();

  useEffect(() => {
    console.log("Monitorando check-in:", checkInId);
    
    // First check current status
    const checkCurrentStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("gym_check_ins")
          .select("*")
          .eq("id", checkInId)
          .single();
          
        if (error) throw error;
        
        if (data.status === 'active') {
          setStatus('confirmed');
          onConfirmed?.();
        } else if (data.status === 'error') {
          setStatus('error');
          onError?.(data.error_message || "Erro ao confirmar check-in");
        }
      } catch (err) {
        console.error("Erro ao verificar status do check-in:", err);
      }
    };
    
    checkCurrentStatus();

    // Subscribe to real-time updates for this specific check-in
    const channel = supabase
      .channel(`check-in-${checkInId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'gym_check_ins',
          filter: `id=eq.${checkInId}`
        },
        (payload: any) => {
          console.log("Atualização de check-in recebida:", payload);
          
          if (payload.new.status === 'active') {
            setStatus('confirmed');
            onConfirmed?.();
            toast({
              title: "Check-in confirmado!",
              description: "Seu check-in foi confirmado pela academia.",
            });
          } else if (payload.new.status === 'error') {
            setStatus('error');
            onError?.(payload.new.error_message || "Erro ao confirmar check-in");
            toast({
              variant: "destructive",
              title: "Erro no check-in",
              description: payload.new.error_message || "Não foi possível confirmar seu check-in",
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [checkInId, onConfirmed, onError, toast]);

  return (
    <Card>
      <CardContent className="flex items-center justify-center p-6">
        {status === "pending" && (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            <p className="text-sm text-muted-foreground">
              Aguardando confirmação da academia...
            </p>
          </div>
        )}
        
        {status === "confirmed" && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p className="text-lg font-semibold">Check-in Confirmado!</p>
            <p className="text-sm text-muted-foreground">
              Boas atividades!
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-16 w-16 text-red-500" />
            <p className="text-lg font-semibold">Erro no Check-in</p>
            <p className="text-sm text-muted-foreground">
              Não foi possível confirmar seu check-in. Por favor, tente novamente.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
