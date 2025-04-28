
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Search, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function CheckInHistory() {
  const { id: academiaId } = useParams<{ id: string }>();
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchCheckIns();
  }, [academiaId, date]);

  const fetchCheckIns = async () => {
    if (!academiaId) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from("gym_check_ins")
        .select(`
          id,
          access_token,
          check_in_time,
          validation_method,
          status,
          valor_repasse,
          user:user_id (id, full_name, email, cpf)
        `)
        .eq("academia_id", academiaId)
        .order("check_in_time", { ascending: false })
        .limit(100);

      if (date) {
        // Filter by date (ignore time part)
        const dateString = format(date, "yyyy-MM-dd");
        query = query.gte("check_in_time", dateString).lt("check_in_time", `${dateString}T23:59:59`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setCheckIns(data || []);
    } catch (error) {
      console.error("Erro ao carregar check-ins:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCheckIns = checkIns.filter((checkIn) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Check if user.full_name exists before accessing it
    const userFullName = checkIn.user?.full_name?.toLowerCase() || "";
    const userEmail = checkIn.user?.email?.toLowerCase() || "";
    const userCpf = checkIn.user?.cpf?.toLowerCase() || "";
    
    return (
      userFullName.includes(searchLower) ||
      userEmail.includes(searchLower) ||
      userCpf.includes(searchLower) ||
      checkIn.access_token?.toLowerCase().includes(searchLower)
    );
  });

  // A simple function to safely access a possibly null reference
  const safeAccess = (obj: any, path: string, defaultValue: any = "") => {
    try {
      const keys = path.split(".");
      let result = obj;
      for (const key of keys) {
        result = result?.[key];
        if (result === undefined || result === null) return defaultValue;
      }
      return result;
    } catch (error) {
      return defaultValue;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Histórico de Check-ins</CardTitle>
          <CardDescription>
            Registro de todos os check-ins realizados na academia
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCheckIns}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isLoading ? "Carregando..." : "Atualizar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou CPF..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "dd/MM/yyyy") : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={ptBR}
                initialFocus
              />
              {date && (
                <div className="p-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDate(null)}
                    className="w-full"
                  >
                    Limpar filtro
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <div className="rounded-md border">
          <div className="min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCheckIns.length > 0 ? (
                  filteredCheckIns.map((checkIn) => (
                    <tr key={checkIn.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {safeAccess(checkIn, "user.full_name", "Nome não disponível")}
                        </div>
                        <div className="text-sm text-gray-500">
                          {safeAccess(checkIn, "user.email", "Email não disponível")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {checkIn.check_in_time
                          ? format(
                              new Date(checkIn.check_in_time),
                              "dd/MM/yyyy HH:mm"
                            )
                          : "Data não registrada"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {checkIn.validation_method === "qr_code" && "QR Code"}
                        {checkIn.validation_method === "access_token" && "Token"}
                        {checkIn.validation_method === "reception" && "Recepção"}
                        {!checkIn.validation_method && "Não especificado"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {checkIn.status === "active" && (
                          <Badge variant="default" className="bg-green-500">Ativo</Badge>
                        )}
                        {checkIn.status === "pending" && (
                          <Badge variant="outline">Pendente</Badge>
                        )}
                        {checkIn.status === "expired" && (
                          <Badge variant="secondary">Expirado</Badge>
                        )}
                        {checkIn.status === "cancelled" && (
                          <Badge variant="destructive">Cancelado</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {checkIn.valor_repasse
                          ? `R$ ${checkIn.valor_repasse.toFixed(2)}`
                          : "R$ 0,00"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      {isLoading
                        ? "Carregando check-ins..."
                        : "Nenhum check-in encontrado"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
