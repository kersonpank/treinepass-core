
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
    console.log("Monitoring check-in:", checkInId);
    
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
          onError?.(data.error_message || "Error confirming check-in");
        }
      } catch (err) {
        console.error("Error checking check-in status:", err);
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
          console.log("Check-in update received:", payload);
          
          if (payload.new.status === 'active') {
            setStatus('confirmed');
            onConfirmed?.();
            toast({
              title: "Check-in confirmed!",
              description: "Your check-in has been confirmed by the gym.",
            });
          } else if (payload.new.status === 'error') {
            setStatus('error');
            onError?.(payload.new.error_message || "Error confirming check-in");
            toast({
              variant: "destructive",
              title: "Check-in error",
              description: payload.new.error_message || "Could not confirm your check-in",
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
              Waiting for gym confirmation...
            </p>
          </div>
        )}
        
        {status === "confirmed" && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p className="text-lg font-semibold">Check-in Confirmed!</p>
            <p className="text-sm text-muted-foreground">
              Enjoy your workout!
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-16 w-16 text-red-500" />
            <p className="text-lg font-semibold">Check-in Error</p>
            <p className="text-sm text-muted-foreground">
              Could not confirm your check-in. Please try again.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
