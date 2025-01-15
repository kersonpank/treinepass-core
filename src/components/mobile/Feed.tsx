import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export function Feed() {
  const { data: feed, isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data: academias, error } = await supabase
        .from("academias")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return academias;
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-[250px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-4">
        {feed?.map((academia) => (
          <Card key={academia.id} className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">{academia.nome}</CardTitle>
            </CardHeader>
            <CardContent>
              {academia.fotos && academia.fotos.length > 0 && (
                <img
                  src={academia.fotos[0]}
                  alt={academia.nome}
                  className="w-full h-48 object-cover rounded-md"
                />
              )}
              <p className="mt-2 text-sm text-muted-foreground">{academia.endereco}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {academia.modalidades.map((modalidade, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                  >
                    {modalidade}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}