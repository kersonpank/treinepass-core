
import type { Gym } from "@/types/gym";

interface InfoTabProps {
  gym: Gym;
}

export function InfoTab({ gym }: InfoTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold">Nome</h4>
        <p>{gym.nome}</p>
      </div>
      <div>
        <h4 className="font-semibold">CNPJ</h4>
        <p>{gym.cnpj}</p>
      </div>
      <div>
        <h4 className="font-semibold">Email</h4>
        <p>{gym.email}</p>
      </div>
      <div>
        <h4 className="font-semibold">Telefone</h4>
        <p>{gym.telefone || "-"}</p>
      </div>
      <div>
        <h4 className="font-semibold">Endereço</h4>
        <p>{gym.endereco || "-"}</p>
      </div>
    </div>
  );
}
