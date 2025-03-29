
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function LoadingSpinner({ size = "md", text }: LoadingSpinnerProps) {
  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-[300px]">
      <Loader2 className={`${sizeClass[size]} animate-spin`} />
      {text && <p className="mt-2 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
