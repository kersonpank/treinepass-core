
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const statusColors = {
  active: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  overdue: "bg-amber-100 text-amber-700",
  expired: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
  refunded: "bg-purple-100 text-purple-700",
};

const statusLabels = {
  active: "Active",
  pending: "Pending",
  overdue: "Overdue",
  expired: "Expired",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const paymentStatusColors = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  overdue: "bg-amber-100 text-amber-700",
  refunded: "bg-purple-100 text-purple-700",
  failed: "bg-red-100 text-red-700",
};

const paymentStatusLabels = {
  paid: "Paid",
  pending: "Pending",
  overdue: "Late",
  refunded: "Refunded",
  failed: "Failed",
};

export function UserSubscriptions() {
  const { toast } = useToast();

  const { data: subscriptions, isLoading, error, refetch } = useQuery({
    queryKey: ["userSubscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_plan_subscriptions")
        .select(`
          *,
          benefit_plans (
            name,
            description,
            monthly_cost,
            rules
          ),
          asaas_payments (
            asaas_id,
            amount,
            billing_type,
            status,
            due_date,
            payment_link,
            invoice_url
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error loading subscriptions",
          description: error.message,
        });
        throw error;
      }
      
      console.log("Fetched subscriptions:", data);
      return data;
    },
  });

  // Setup realtime subscription for payment status updates
  useEffect(() => {
    const user = supabase.auth.getUser();
    let userId = '';
    
    user.then(({ data }) => {
      userId = data?.user?.id || '';
      
      if (!userId) {
        console.error("No user ID available for realtime subscription");
        return;
      }
      
      console.log("Setting up realtime subscription for user:", userId);
      
      // Channel for user_plan_subscriptions updates
      const planChannel = supabase
        .channel("user-plan-subscription-changes")
        .on(
          "postgres_changes",
          {
            event: "*", // Listen to all events
            schema: "public",
            table: "user_plan_subscriptions",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("Subscription update detected:", payload);
            refetch();
            
            // Show toast notification for status changes
            const newStatus = payload.new.status;
            const oldStatus = payload.old.status;
            const newPaymentStatus = payload.new.payment_status;
            const oldPaymentStatus = payload.old.payment_status;
            
            if (newPaymentStatus === 'paid' && oldPaymentStatus !== 'paid') {
              toast({
                title: "Payment confirmed!",
                description: "Your subscription payment has been confirmed.",
                variant: "default",
              });
            } else if (newStatus !== oldStatus) {
              toast({
                title: `Subscription status: ${statusLabels[newStatus] || newStatus}`,
                description: `Your subscription status has been updated.`,
                variant: "default",
              });
            }
          }
        )
        .subscribe();

      // Also set up listener for asaas_payments updates
      const paymentsChannel = supabase
        .channel("asaas-payments-changes")
        .on(
          "postgres_changes",
          {
            event: "*", // Listen to all events
            schema: "public",
            table: "asaas_payments",
          },
          (payload) => {
            console.log("Payment update detected:", payload);
            if (payload.new.status !== payload.old.status) {
              // When payment status changes, refresh subscriptions
              refetch();
            }
          }
        )
        .subscribe();

      // Also listen for webhook events
      const webhooksChannel = supabase
        .channel("webhook-events")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "asaas_webhook_events",
          },
          (payload) => {
            console.log("Webhook event detected:", payload);
            // Refresh on any webhook event
            refetch();
          }
        )
        .subscribe();

      return () => {
        console.log("Cleaning up realtime subscriptions");
        supabase.removeChannel(planChannel);
        supabase.removeChannel(paymentsChannel);
        supabase.removeChannel(webhooksChannel);
      };
    });
  }, [refetch, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Error loading subscriptions. Please try again.
        </CardContent>
      </Card>
    );
  }

  if (!subscriptions?.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          You don't have any subscriptions yet.
        </CardContent>
      </Card>
    );
  }

  const refreshSubscriptions = async () => {
    toast({
      title: "Updating...",
      description: "Checking your subscription status",
    });
    
    await refetch();
    
    toast({
      title: "Updated",
      description: "Subscription status updated",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button 
          onClick={refreshSubscriptions} 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Update Status
        </Button>
      </div>
      
      {subscriptions.map((subscription) => {
        // Find the latest payment
        const latestPayment = subscription.asaas_payments?.length > 0 
          ? subscription.asaas_payments.reduce((latest, current) => {
              return new Date(current.due_date) > new Date(latest.due_date) ? current : latest;
            })
          : null;
        
        // Determine payment link - prioritize subscription's direct link, then payment links
        const paymentLink = subscription.asaas_payment_link || 
                           (latestPayment?.payment_link || latestPayment?.invoice_url);
        
        // Check if there's a pending or overdue payment that needs action
        const requiresPayment = ['pending', 'overdue'].includes(subscription.payment_status) && paymentLink;

        return (
          <Card key={subscription.id} className="overflow-hidden">
            <CardHeader className="bg-slate-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{subscription.benefit_plans.name}</CardTitle>
                <Badge className={statusColors[subscription.status] || statusColors.pending}>
                  {statusLabels[subscription.status] || "Pending"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly cost:</span>
                <span className="font-medium">
                  {formatCurrency(subscription.benefit_plans.monthly_cost)}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment status:</span>
                <span className="font-medium">
                  <Badge className={paymentStatusColors[subscription.payment_status] || paymentStatusColors.pending}>
                    {paymentStatusLabels[subscription.payment_status] || "Pending"}
                  </Badge>
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Start:</span>
                <span>{new Date(subscription.start_date).toLocaleDateString()}</span>
              </div>
              
              {subscription.end_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">End:</span>
                  <span>{new Date(subscription.end_date).toLocaleDateString()}</span>
                </div>
              )}
              
              {subscription.last_payment_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last payment:</span>
                  <span>{new Date(subscription.last_payment_date).toLocaleDateString()}</span>
                </div>
              )}
              
              {subscription.next_payment_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Next payment:</span>
                  <span>{new Date(subscription.next_payment_date).toLocaleDateString()}</span>
                </div>
              )}
              
              {/* Display payment button if payment is pending or overdue */}
              {requiresPayment && (
                <div className="mt-4">
                  <a 
                    href={paymentLink} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-primary text-white rounded-md py-2 mt-2 hover:bg-primary/90 transition-colors"
                  >
                    Make Payment
                  </a>
                </div>
              )}
              
              {/* Display payment history button if subscription has payments */}
              {subscription.asaas_payments?.length > 0 && (
                <div className="mt-2 text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      toast({
                        title: "Coming soon",
                        description: "Payment history will be available soon",
                      });
                    }}
                  >
                    View payment history
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
