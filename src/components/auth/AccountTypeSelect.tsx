import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Building2, Dumbbell } from "lucide-react";

interface AccountTypeSelectProps {
  onValueChange: (value: string) => void;
  defaultValue?: string;
}

const accountTypes = [
  { id: 'individual', label: 'Usuário', icon: User },
  { id: 'business', label: 'Empresa', icon: Building2 },
  { id: 'gym', label: 'Academia', icon: Dumbbell }
];

export const AccountTypeSelect = ({ onValueChange, defaultValue = 'individual' }: AccountTypeSelectProps) => {
  return (
    <Select onValueChange={onValueChange} defaultValue={defaultValue}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione o tipo de conta" />
      </SelectTrigger>
      <SelectContent>
        {accountTypes.map((type) => {
          const Icon = type.icon;
          return (
            <SelectItem key={type.id} value={type.id}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{type.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};