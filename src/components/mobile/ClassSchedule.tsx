import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ClassSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedAcademia, setSelectedAcademia] = useState<string | null>(null);

  const { data: academias } = useQuery({
    queryKey: ["academias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academias")
        .select("id, nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: horarios } = useQuery({
    queryKey: ["horarios", selectedAcademia, selectedDate],
    enabled: !!selectedAcademia && !!selectedDate,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academias")
        .select("horario_funcionamento")
        .eq("id", selectedAcademia)
        .single();

      if (error) throw error;
      return data.horario_funcionamento;
    },
  });

  const diaDaSemana = selectedDate
    ? format(selectedDate, "EEEE", { locale: ptBR })
    : "";

  return (
    <div className="p-4 space-y-4">
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Selecione uma Academia</h3>
            <div className="flex flex-wrap gap-2">
              {academias?.map((academia) => (
                <Button
                  key={academia.id}
                  variant={selectedAcademia === academia.id ? "default" : "outline"}
                  onClick={() => setSelectedAcademia(academia.id)}
                >
                  {academia.nome}
                </Button>
              ))}
            </div>
          </div>

          {selectedAcademia && horarios && (
            <Card>
              <CardHeader>
                <CardTitle>Horários Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {horarios[diaDaSemana.toLowerCase()]?.map((horario: any, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span>{horario.hora}</span>
                      <span>{horario.modalidade}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}