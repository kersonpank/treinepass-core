import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { CheckInCode } from "@/types/check-in";
import { QRCodeDisplay } from "./check-in/QRCodeDisplay";
import { CheckInButton } from "./check-in/CheckInButton";
import { differenceInSeconds } from "date-fns";

export function DigitalCard() {
  const [activeCode, setActiveCode] = useState<CheckInCode | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const { academiaId } = useParams();

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: checkInCode, refetch: refetchCheckInCode } = useQuery({
    queryKey: ["activeCheckInCode", userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return null;

      const { data, error } = await supabase
        .from("check_in_codes")
        .select("*")
        .eq("user_id", userProfile.id)
        .eq("status", "active")
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data as CheckInCode | null;
    },
    enabled: !!userProfile?.id,
  });

  useEffect(() => {
    if (!checkInCode || checkInCode.status !== "active") {
      setTimeLeft(0);
      setActiveCode(null);
      return;
    }

    setActiveCode(checkInCode);

    const updateTimer = () => {
      const secondsLeft = differenceInSeconds(
        new Date(checkInCode.expires_at),
        new Date()
      );

      if (secondsLeft <= 0) {
        setTimeLeft(0);
        setActiveCode(null);
        refetchCheckInCode();
      } else {
        setTimeLeft(secondsLeft);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [checkInCode]);

  const handleCheckInSuccess = (newCode: CheckInCode) => {
    setActiveCode(newCode);
    refetchCheckInCode();
  };

  if (!userProfile) {
    return null;
  }

  return (
    <div className="p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Carteirinha Digital</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">{userProfile.full_name}</h3>
            <p className="text-sm text-muted-foreground">CPF: {userProfile.cpf}</p>
          </div>

          {activeCode && timeLeft > 0 ? (
            <QRCodeDisplay checkInCode={activeCode} timeLeft={timeLeft} />
          ) : (
            academiaId && (
              <CheckInButton
                academiaId={academiaId}
                userId={userProfile.id}
                onSuccess={handleCheckInSuccess}
              />
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}