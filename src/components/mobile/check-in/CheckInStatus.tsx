import { useEffect, useState } from "react";
import { differenceInSeconds } from "date-fns";
import { CheckInCode } from "@/types/check-in";

interface CheckInStatusProps {
  checkInCode: CheckInCode;
  onExpire: () => void;
}

export function CheckInStatus({ checkInCode, onExpire }: CheckInStatusProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      const secondsLeft = differenceInSeconds(
        new Date(checkInCode.expires_at),
        new Date()
      );

      if (secondsLeft <= 0) {
        setTimeLeft(0);
        onExpire();
      } else {
        setTimeLeft(secondsLeft);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [checkInCode, onExpire]);

  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="text-center space-y-2">
      <p className="text-lg font-semibold">Código: {checkInCode.code}</p>
      <p className="text-sm text-muted-foreground">
        Apresente este QR Code ou informe o código acima
      </p>
      <p className="text-sm font-medium">
        Expira em: {formatTimeLeft(timeLeft)}
      </p>
    </div>
  );
}