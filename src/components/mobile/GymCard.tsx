import { useNavigate } from "react-router-dom";
import { Clock, MapPin } from "lucide-react";
import { BackgroundGradient } from "@/components/ui/background-gradient";

interface GymCardProps {
  id: string;
  name: string;
  address: string;
  imageUrl?: string;
  horario_funcionamento?: Record<string, any>;
  modalidades?: { modalidade: { nome: string } }[];
}

export function GymCard({ 
  id, 
  name, 
  address, 
  imageUrl,
  horario_funcionamento,
  modalidades 
}: GymCardProps) {
  const navigate = useNavigate();

  const handleCheckIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/app/digital-card/${id}`);
  };

  const handleViewDetails = () => {
    navigate(`/app/gym/${id}`);
  };

  const getHorarioHoje = () => {
    if (!horario_funcionamento) return null;
    const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).split('-')[0].toLowerCase();
    const diaMap: Record<string, string> = {
      'domingo': 'domingo',
      'segunda': 'segunda',
      'terça': 'terca',
      'quarta': 'quarta',
      'quinta': 'quinta',
      'sexta': 'sexta',
      'sábado': 'sabado'
    };
    const dia = diaMap[hoje];
    if (!horario_funcionamento[dia]) return null;
    return `${horario_funcionamento[dia].abertura} - ${horario_funcionamento[dia].fechamento}`;
  };

  return (
    <div className="px-2" onClick={handleViewDetails}>
      <BackgroundGradient className="rounded-[22px] p-4 sm:p-6 bg-white dark:bg-zinc-900">
        <div className="aspect-[4/3] overflow-hidden rounded-xl mb-4">
          <img
            src={imageUrl || "/placeholder-gym.jpg"}
            alt={name}
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>

        <h3 className="font-bold text-xl mb-2 text-black dark:text-neutral-200">
          {name}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{address}</span>
          </div>

          {getHorarioHoje() && (
            <div className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <Clock className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Hoje: {getHorarioHoje()}</span>
            </div>
          )}

          {modalidades && modalidades.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {modalidades.slice(0, 3).map((m, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                >
                  {m.modalidade.nome}
                </span>
              ))}
              {modalidades.length > 3 && (
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  +{modalidades.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleCheckIn}
          className="w-full rounded-full py-2 text-white flex items-center justify-center space-x-1 bg-primary hover:bg-primary/90 transition-colors"
        >
          Check-in
        </button>
      </BackgroundGradient>
    </div>
  );
}