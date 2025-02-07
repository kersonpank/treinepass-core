
interface AccessTokenDisplayProps {
  accessCode: string;
  timeLeft: number;
}

export function AccessTokenDisplay({ accessCode, timeLeft }: AccessTokenDisplayProps) {
  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="py-4 space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Forneça este código para a academia:
        </p>
        <div className="text-3xl font-mono font-bold tracking-wider bg-muted p-4 rounded-lg">
          {accessCode}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Este código expira em: {formatTimeLeft(timeLeft)}
        </p>
      </div>
    </div>
  );
}
