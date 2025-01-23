import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Iniciando processo de login admin...");
      
      // 1. Primeiro fazer login
      const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;
      if (!authData.user) throw new Error("Nenhum usuário retornado após login");

      console.log("Login bem sucedido, verificando permissões de admin...");

      // 2. Verificar se o usuário é admin usando uma query direta
      const { data: adminCheck, error: adminError } = await supabase
        .from("user_types")
        .select("id")
        .eq("user_id", authData.user.id)
        .eq("type", "admin")
        .single();

      console.log("Resultado da verificação admin:", { adminCheck, adminError });

      if (adminError) {
        if (adminError.code === "PGRST116") {
          throw new Error("Usuário não tem permissão de administrador");
        }
        throw adminError;
      }

      if (!adminCheck) {
        throw new Error("Acesso não autorizado");
      }

      console.log("Verificação de admin bem sucedida, redirecionando...");
      navigate("/admin/dashboard");
    } catch (error: any) {
      console.error("Erro detalhado:", error);
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      setIsResetting(false);
    } catch (error: any) {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Erro ao enviar email",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!isResetting ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => setIsResetting(true)}
              >
                Esqueceu sua senha?
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => setIsResetting(false)}
              >
                Voltar ao login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}