
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Parse payment data from URL or fetch from database
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!user) return;
      
      try {
        const searchParams = new URLSearchParams(location.search);
        const paymentId = searchParams.get('payment_id');
        const status = searchParams.get('status');
        const externalReference = searchParams.get('external_reference');
        
        if (status === 'approved' || status === 'pending') {
          // Find subscription by external reference (if provided)
          if (externalReference) {
            const { data, error } = await supabase
              .from('user_plan_subscriptions')
              .select(`
                *,
                benefit_plans:plan_id (name, monthly_cost, description)
              `)
              .eq('id', externalReference)
              .single();
            
            if (!error && data) {
              setSubscriptionData(data);
            }
          } else {
            // Find user's active subscription
            const { data, error } = await supabase
              .from('user_plan_subscriptions')
              .select(`
                *,
                benefit_plans:plan_id (name, monthly_cost, description)
              `)
              .eq('user_id', user.id)
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (!error && data) {
              setSubscriptionData(data);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubscriptionData();
  }, [user, location.search]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="container max-w-md py-12">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Pagamento aprovado!</CardTitle>
          <CardDescription>
            Seu pagamento foi processado com sucesso.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isLoading && subscriptionData && (
            <div className="rounded-md bg-muted p-4">
              <p className="font-semibold">Detalhes da assinatura</p>
              <p className="text-sm">Plano: {subscriptionData.benefit_plans?.name || 'Plano'}</p>
              <p className="text-sm">
                Valor: R$ {(subscriptionData.benefit_plans?.monthly_cost || subscriptionData.total_value || 0).toFixed(2).replace('.', ',')}
              </p>
              <p className="text-sm">
                Status: <span className="text-green-600 font-medium">Ativo</span>
              </p>
            </div>
          )}
          
          <p className="text-center text-sm text-muted-foreground">
            Obrigado por sua compra. Você agora tem acesso completo ao seu plano.
          </p>
        </CardContent>
        
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleGoToDashboard}
          >
            Ir para o Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
