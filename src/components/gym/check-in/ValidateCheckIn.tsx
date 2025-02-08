
import { useEffect } from "react";
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

  if (!academiaId) {
    return <div>ID da academia não encontrado</div>;
  }

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
