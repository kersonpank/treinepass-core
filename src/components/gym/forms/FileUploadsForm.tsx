import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FileUploadsFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export function FileUploadsForm({ register, errors }: FileUploadsFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fotos">Fotos do Espaço</Label>
        <Input
          id="fotos"
          type="file"
          accept="image/*"
          multiple
          {...register("fotos", { required: "Envie pelo menos uma foto" })}
        />
        {errors.fotos && (
          <p className="text-sm text-red-500">{errors.fotos.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="documentos">Documentos</Label>
        <Input
          id="documentos"
          type="file"
          accept=".pdf,.doc,.docx"
          multiple
          {...register("documentos", {
            required: "Envie os documentos necessários",
          })}
        />
        {errors.documentos && (
          <p className="text-sm text-red-500">{errors.documentos.message as string}</p>
        )}
      </div>
    </div>
  );
}