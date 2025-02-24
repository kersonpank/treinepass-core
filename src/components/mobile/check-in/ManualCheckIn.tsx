
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckInLimitsDisplay } from "./components/CheckInLimitsDisplay";
import { NoPlanDialog } from "./components/NoPlanDialog";
import { CheckInDialog } from "./components/CheckInDialog";
import { CheckInConfirmation } from "./components/CheckInConfirmation";
import { AccessCodeGenerator } from "./components/AccessCodeGenerator";
import { CheckInProcessing } from "./components/CheckInProcessing";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ManualCheckInProps {
  academiaId: string;
}

interface CheckInLimits {
  remainingDaily: number | null;
  remainingWeekly: number | null;
  remainingMonthly: number | null;
}

export function ManualCheckIn({ academiaId }: ManualCheckInProps) {
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showNoPlanDialog, setShowNoPlanDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkInLimits, setCheckInLimits] = useState<CheckInLimits | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds
  const [checkInId, setCheckInId] = useState<string | null>(null);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const { toast } = useToast();

  const handleCheckInClick = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Você precisa estar logado para fazer check-in",
        });
        return;
      }
      setShowCheckInDialog(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível verificar seu plano",
      });
    }
  };

  const handleScanSuccess = (checkInId: string) => {
    setCheckInId(checkInId);
    setShowCheckInDialog(false);
    setShowConfirmationDialog(true);
  };

  const handleScanError = (error: string) => {
    toast({
      variant: "destructive",
      title: "Erro ao realizar check-in",
      description: error,
      duration: 5000,
    });
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Check-in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full" 
            onClick={handleCheckInClick}
            disabled={isProcessing}
          >
            Fazer Check-in
          </Button>
          <CheckInLimitsDisplay limits={checkInLimits} />
        </CardContent>
      </Card>

      {showCheckInDialog && (
        <>
          <AccessCodeGenerator
            academiaId={academiaId}
            onSuccess={(code, limits) => {
              setAccessCode(code);
              setCheckInLimits(limits);
              setTimeLeft(1200);
            }}
            onNoPlan={() => {
              setShowCheckInDialog(false);
              setShowNoPlanDialog(true);
            }}
          />
          <CheckInDialog
            open={showCheckInDialog}
            onOpenChange={setShowCheckInDialog}
            accessCode={accessCode}
            timeLeft={timeLeft}
            onScan={async (result) => {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                setIsProcessing(true);
                return <CheckInProcessing
                  userId={user.id}
                  academiaId={academiaId}
                  qrCodeResult={result}
                  onSuccess={handleScanSuccess}
                  onError={handleScanError}
                />;
              }
            }}
          />
        </>
      )}

      {showConfirmationDialog && checkInId && (
        <CheckInConfirmation
          checkInId={checkInId}
          onConfirmed={() => {
            setShowConfirmationDialog(false);
            toast({
              title: "Check-in realizado!",
              description: "Check-in realizado com sucesso. Boas atividades!",
              duration: 5000,
            });
          }}
          onError={(error) => {
            setShowConfirmationDialog(false);
            toast({
              variant: "destructive",
              title: "Erro no check-in",
              description: error,
              duration: 5000,
            });
          }}
        />
      )}

      <NoPlanDialog
        open={showNoPlanDialog}
        onOpenChange={setShowNoPlanDialog}
      />
    </>
  );
}
