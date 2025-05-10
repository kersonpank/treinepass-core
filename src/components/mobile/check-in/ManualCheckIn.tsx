
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckInCode } from "@/types/check-in";
import { Loader2 } from "lucide-react";

interface ManualCheckInProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academiaId: string;
  onSuccess: (checkInCode: CheckInCode) => void;
}

export function ManualCheckIn({
  open,
  onOpenChange,
  academiaId,
  onSuccess,
}: ManualCheckInProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Você precisa estar logado para fazer check-in");
      }

      // Get the check-in code
      const { data: checkInCode, error: codeError } = await supabase
        .from("check_in_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("status", "active")
        .eq("academia_id", academiaId)
        .single();

      if (codeError || !checkInCode) {
        throw new Error("Código de check-in inválido ou expirado");
      }

      // Verify if code is expired
      if (new Date(checkInCode.expires_at) < new Date()) {
        // Update the code status to expired
        await supabase
          .from("check_in_codes")
          .update({ status: "expired" })
          .eq("id", checkInCode.id);
        throw new Error("Código de check-in expirado");
      }

      // Register check-in
      const { error: usedError } = await supabase
        .from("check_in_codes")
        .update({
          status: "used",
          used_at: new Date().toISOString(),
        })
        .eq("id", checkInCode.id);

      if (usedError) {
        throw new Error("Erro ao registrar check-in");
      }

      // Register check-in in gym_check_ins table if it exists
      try {
        const { error: checkInError } = await supabase
          .from("gym_check_ins")
          .insert({
            user_id: user.id,
            academia_id: academiaId,
            check_in_code_id: checkInCode.id,
            validation_method: "manual",
            check_in_time: new Date().toISOString(),
            status: "used",
          });

        if (checkInError) console.error("Erro ao registrar check-in:", checkInError);
      } catch (err) {
        // Ignore errors if the table doesn't exist
        console.log("Aviso: não foi possível registrar check-in completo:", err);
      }

      toast({
        title: "Check-in realizado!",
        description: "Seu check-in foi registrado com sucesso.",
      });

      onSuccess(checkInCode as CheckInCode);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao realizar check-in",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Check-in Manual</DialogTitle>
          <DialogDescription>
            Digite o código de check-in fornecido pela academia.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Código de check-in"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="text-center text-xl tracking-widest"
            maxLength={10}
          />

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={!code || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Realizar Check-in"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
