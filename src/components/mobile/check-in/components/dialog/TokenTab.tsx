
import { AccessTokenDisplay } from "../AccessTokenDisplay";

interface TokenTabProps {
  accessCode: string;
  timeLeft: number;
}

export function TokenTab({ accessCode, timeLeft }: TokenTabProps) {
  return (
    <div className="mt-4">
      <AccessTokenDisplay accessCode={accessCode} timeLeft={timeLeft} />
    </div>
  );
}
