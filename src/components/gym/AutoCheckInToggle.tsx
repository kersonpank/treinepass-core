
import { useState } from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AutoCheckInToggleProps {
  academiaId: string;
  initialValue: boolean;
  onToggle: (newValue: boolean) => void;
  className?: string;
}

export function AutoCheckInToggle({ 
  academiaId, 
  initialValue, 
  onToggle,
  className 
}: AutoCheckInToggleProps) {
  const [isAutomatic, setIsAutomatic] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("academias")
        .update({ automatic_checkin: !isAutomatic })
        .eq("id", academiaId);

      if (error) throw error;

      setIsAutomatic(!isAutomatic);
      onToggle(!isAutomatic);

      toast({
        title: "Sucesso",
        description: `Check-in automático ${!isAutomatic ? 'ativado' : 'desativado'}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a configuração.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-300",
        isAutomatic ? "bg-green-100" : "bg-zinc-100",
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={() => !isLoading && handleToggle()}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center gap-2">
        {isAutomatic ? (
          <ToggleRight className="w-6 h-6 text-green-600" />
        ) : (
          <ToggleLeft className="w-6 h-6 text-zinc-600" />
        )}
        <span className="text-sm font-medium">
          Check-in automático {isAutomatic ? 'ativado' : 'desativado'}
        </span>
      </div>
    </div>
  );
}
