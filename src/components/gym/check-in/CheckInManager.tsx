import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ValidateCheckIn } from "./ValidateCheckIn";
import { CheckInHistory } from "./CheckInHistory";

export function CheckInManager() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gerenciamento de Check-in</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="validate" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="validate">Validar Check-in</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="validate">
            <ValidateCheckIn />
          </TabsContent>

          <TabsContent value="history">
            <CheckInHistory />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}