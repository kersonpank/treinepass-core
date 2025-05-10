import React from 'react';
import { AlertTriangle as ExclamationTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AsaasBrickWrapperProps {
  containerId: string;
  isLoading?: boolean;
  error?: string | null;
}

export function AsaasBrickWrapper({
  containerId,
  isLoading = false,
  error = null
}: AsaasBrickWrapperProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <ExclamationTriangle className="h-10 w-10 text-destructive mb-2" />
            <h3 className="font-semibold text-lg">Erro ao carregar pagamento</h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        ) : (
          <div id={containerId} className="w-full"></div>
        )}
      </CardContent>
    </Card>
  );
}
