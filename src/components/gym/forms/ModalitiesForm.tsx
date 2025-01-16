import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Label } from "@/components/ui/label";

interface ModalitiesFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  modalidades?: { id: string; nome: string }[];
}

export function ModalitiesForm({ register, errors, modalidades }: ModalitiesFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Modalidades Oferecidas</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {modalidades?.map((modalidade) => (
          <div key={modalidade.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={modalidade.id}
              value={modalidade.id}
              {...register("modalidades", {
                required: "Selecione pelo menos uma modalidade",
              })}
              className="w-4 h-4 text-[#0125F0] border-gray-300 rounded focus:ring-[#0125F0]"
            />
            <Label htmlFor={modalidade.id}>{modalidade.nome}</Label>
          </div>
        ))}
      </div>
      {errors.modalidades && (
        <p className="text-sm text-red-500">{errors.modalidades.message as string}</p>
      )}
    </div>
  );
}