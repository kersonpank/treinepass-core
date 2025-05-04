
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { CheckInButton } from "./check-in/CheckInButton";

// Define the CheckInCode type
interface CheckInCode {
  id: string;
  user_id: string;
  code: string;
  status: string;
  expires_at: string;
  created_at: string;
  used_at?: string;
}

// Define CheckInDisplay component since it's used but not provided in the files
function CheckInDisplay({ checkInCode, onExpire }: { checkInCode: CheckInCode; onExpire: () => void }) {
  // Simple component to display active check-in code
  return (
    <div className="text-center p-4 border rounded-md">
      <h3 className="font-bold text-xl">{checkInCode.code}</h3>
      <p className="text-sm text-gray-500">
        Válido até {new Date(checkInCode.expires_at).toLocaleTimeString()}
      </p>
    </div>
  );
}

export function DigitalCard() {
  const [activeCode, setActiveCode] = useState<CheckInCode | null>(null);
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

  // Skip this query since check_in_codes table may not exist yet
  /*
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
  */

  // Simplified for now without check_in_codes
  const handleCheckInSuccess = (newCode: any) => {
    console.log("Check-in successful:", newCode);
    // setActiveCode(newCode);
  };

  const handleExpire = () => {
    setActiveCode(null);
    // refetchCheckInCode();
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

          {activeCode ? (
            <CheckInDisplay 
              checkInCode={activeCode} 
              onExpire={handleExpire}
            />
          ) : (
            academiaId && (
              <CheckInButton
                academiaId={academiaId}
                onSuccess={handleCheckInSuccess}
              />
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
