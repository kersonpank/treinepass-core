
import { CheckInCode } from "@/types/check-in";

export interface CheckInButtonProps {
  academiaId: string;
  userId?: string;
  onSuccess: (newCode: CheckInCode) => void;
}
