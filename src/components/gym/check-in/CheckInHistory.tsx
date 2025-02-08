
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { CheckInSummary } from "./components/CheckInSummary";
import { CheckInsTable } from "./components/CheckInsTable";
import { CheckInHistoryItem } from "@/types/check-in";
import { useToast } from "@/hooks/use-toast";

export function CheckInHistory() {
  const { id: academiaId } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: checkIns, isLoading } = useQuery<CheckInHistoryItem[]>({
    queryKey: ["check-ins-history", academiaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gym_check_ins")
        .select(`
          *,
          user:user_profiles (
            full_name,
            email,
            cpf
          )
        `)
        .eq('academia_id', academiaId)
        .order("check_in_time", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!academiaId) return;

    // Subscribe to real-time updates for check-ins
    const channel = supabase
      .channel('gym_check_ins')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gym_check_ins',
          filter: `academia_id=eq.${academiaId}`
        },
        () => {
          // Invalidate and refetch the check-ins query
          queryClient.invalidateQueries({ queryKey: ["check-ins-history", academiaId] });
          toast({
            title: "Novo check-in",
            description: "Um novo check-in foi registrado!",
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [academiaId, queryClient, toast]);

  if (isLoading) {
    return <div>Carregando histórico...</div>;
  }

  return (
    <Card>
      <CheckInSummary checkIns={checkIns || []} />
      <CardContent>
        <CheckInsTable checkIns={checkIns || []} />
      </CardContent>
    </Card>
  );
}
