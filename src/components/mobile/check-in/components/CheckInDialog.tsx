
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { QRCodeScanner } from "./QRCodeScanner";
import { AccessTokenDisplay } from "./AccessTokenDisplay";

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessCode: string;
  timeLeft: number;
  onScan: (result: string, method: 'qr_code' | 'token') => void;
}

export function CheckInDialog({ 
  open, 
  onOpenChange, 
  accessCode, 
  timeLeft, 
  onScan 
}: CheckInDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="relative">
          <AlertDialogTitle>Check-in</AlertDialogTitle>
          <AlertDialogDescription>
            Escolha como deseja realizar o check-in
          </AlertDialogDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDialogHeader>
        <Tabs defaultValue="qrcode" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
            <TabsTrigger value="token">Token de Acesso</TabsTrigger>
          </TabsList>
          <TabsContent value="qrcode" className="mt-4">
            <QRCodeScanner onScan={onScan} />
          </TabsContent>
          <TabsContent value="token" className="mt-4">
            <AccessTokenDisplay accessCode={accessCode} timeLeft={timeLeft} />
          </TabsContent>
        </Tabs>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Fechar
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
