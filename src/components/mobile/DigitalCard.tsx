import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";

export function DigitalCard() {
  const [qrCode, setQrCode] = useState<string>("");

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

  useEffect(() => {
    // Gerar um novo QR code a cada 5 minutos
    const generateQRCode = () => {
      const timestamp = new Date().getTime();
      const userId = userProfile?.id;
      const code = `${userId}-${timestamp}`;
      setQrCode(code);
    };

    generateQRCode();
    const interval = setInterval(generateQRCode, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userProfile]);

  return (
    <div className="p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Carteirinha Digital</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {userProfile && (
            <>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">{userProfile.full_name}</h3>
                <p className="text-sm text-muted-foreground">CPF: {userProfile.cpf}</p>
              </div>
              <div className="flex justify-center">
                <QRCodeSVG
                  value={qrCode}
                  size={200}
                  level="H"
                  includeMargin
                  className="border-8 border-white rounded-lg shadow-lg"
                />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                QR Code atualizado automaticamente a cada 5 minutos
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}