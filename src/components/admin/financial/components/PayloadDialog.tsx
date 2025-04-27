
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PayloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: any;
}

export function PayloadDialog({ open, onOpenChange, payload }: PayloadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Payload do Webhook</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-md">
            <pre className="text-xs overflow-auto max-h-[400px]">
              {payload && JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
