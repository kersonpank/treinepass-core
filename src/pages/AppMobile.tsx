
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { LogOut, Bug } from "lucide-react";
import { GymSearch } from "@/components/mobile/GymSearch";
import { ClassSchedule } from "@/components/mobile/ClassSchedule";
import { DigitalCard } from "@/components/mobile/DigitalCard";
import { PlansTab } from "@/components/mobile/PlansTab";
import { GymProfile } from "@/pages/GymProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useMercadoPagoStatus } from "@/hooks/useMercadoPagoStatus";

export default function AppMobile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [showDebug, setShowDebug] = useState(false);
  const { envVariables, statusOk } = useMercadoPagoStatus();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Não foi possível fazer logout. Tente novamente.",
      });
      return;
    }
    navigate("/");
  };

  const testMercadoPagoPreference = async () => {
    try {
      toast({
        title: "Teste iniciado",
        description: "Testando criação de preferência do Mercado Pago..."
      });

      const testData = {
        items: [
          {
            id: "test-plan",
            title: "Plano Teste",
            description: "Plano para teste de integração",
            quantity: 1,
            currency_id: "BRL",
            unit_price: 0.01
          }
        ],
        back_urls: {
          success: `${window.location.origin}/payment/success`,
          failure: `${window.location.origin}/payment/failure`,
          pending: `${window.location.origin}/payment/pending`
        },
        auto_return: "approved",
        notification_url: `${window.location.origin}/api/webhooks/mercadopago`,
        external_reference: `test_user_test`,
      };

      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao criar preferência');
      }
      
      toast({
        title: "Teste concluído",
        description: "Preferência criada com sucesso. Verifique o console para detalhes."
      });
      
      console.log("Preferência criada com sucesso:", result);
      
      // Mostrar link para o checkout
      const isSandbox = import.meta.env.VITE_PUBLIC_MERCADO_PAGO_SANDBOX === 'true';
      const checkoutUrl = isSandbox ? result.sandbox_init_point : result.init_point;
      
      if (confirm("Deseja abrir a página de checkout para teste?")) {
        window.open(checkoutUrl, "_blank");
      }
    } catch (error: any) {
      console.error("Erro ao testar mercado pago:", error);
      toast({
        variant: "destructive",
        title: "Erro no teste",
        description: error.message || "Não foi possível testar o Mercado Pago"
      });
    }
  };

  const defaultTab = location.pathname.includes('/plans') ? 'plans' : 'search';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 bg-white z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">TreinePass</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowDebug(!showDebug)}>
              <Bug className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 pt-20 pb-8">
        {showDebug && (
          <Alert className="mb-4">
            <AlertTitle>Informações de Debug</AlertTitle>
            <AlertDescription>
              <div className="text-xs space-y-1">
                <p>Mercado Pago Public Key: {envVariables.PUBLIC_KEY || 'Não configurada'}</p>
                <p>Mercado Pago Access Token: {envVariables.ACCESS_TOKEN || 'Não configurado'}</p>
                <p>Sandbox: {envVariables.SANDBOX || 'Não configurado'}</p>
                <p>Site URL: {envVariables.SITE_URL || window.location.origin}</p>
                <p>Current Route: {location.pathname}</p>
                
                <div className="flex space-x-2 mt-2">
                  <button 
                    className="text-xs text-blue-500 hover:underline"
                    onClick={() => {
                      console.log('Testando console log');
                      toast({ 
                        title: "Teste de Toast", 
                        description: "Este é um teste de notificação" 
                      });
                    }}
                  >
                    Testar log/toast
                  </button>
                  
                  <button 
                    className="text-xs text-green-500 hover:underline"
                    onClick={testMercadoPagoPreference}
                  >
                    Testar Mercado Pago
                  </button>
                </div>
                
                <div className="mt-2">
                  <p className="font-semibold">Status da integração: {statusOk ? '✅ OK' : '❌ Não configurado corretamente'}</p>
                  {!statusOk && (
                    <p className="text-red-500">Verifique as configurações das variáveis de ambiente.</p>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <Routes>
          <Route path="gym/:id" element={<GymProfile />} />
          <Route path="*" element={
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="search">Buscar</TabsTrigger>
                <TabsTrigger value="schedule">Agenda</TabsTrigger>
                <TabsTrigger value="plans">Planos</TabsTrigger>
                <TabsTrigger value="card">Cartão</TabsTrigger>
              </TabsList>

              <TabsContent value="search">
                <GymSearch />
              </TabsContent>

              <TabsContent value="schedule">
                <ClassSchedule />
              </TabsContent>

              <TabsContent value="plans">
                <PlansTab />
              </TabsContent>

              <TabsContent value="card">
                <DigitalCard />
              </TabsContent>
            </Tabs>
          } />
        </Routes>
      </main>
    </div>
  );
}
