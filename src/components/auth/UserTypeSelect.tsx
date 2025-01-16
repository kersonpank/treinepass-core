import React from "react";
import { motion } from "framer-motion";
import { User, Building2, Dumbbell } from "lucide-react";

interface UserType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const userTypes: UserType[] = [
  {
    id: "individual",
    title: "Pessoa Física",
    description: "Acesse múltiplas academias com uma única assinatura",
    icon: <User className="w-6 h-6" />,
  },
  {
    id: "business",
    title: "Empresa",
    description: "Ofereça acesso à academia como benefício aos seus funcionários",
    icon: <Building2 className="w-6 h-6" />,
  },
  {
    id: "gym",
    title: "Academia",
    description: "Seja parceiro e alcance mais clientes",
    icon: <Dumbbell className="w-6 h-6" />,
  },
];

interface UserTypeSelectProps {
  onSelect: (type: string) => void;
  availableTypes?: string[];
}

export const UserTypeSelect = ({ onSelect, availableTypes }: UserTypeSelectProps) => {
  const filteredTypes = availableTypes 
    ? userTypes.filter(type => availableTypes.includes(type.id))
    : userTypes;

  return (
    <div className="grid gap-4">
      {filteredTypes.map((type, index) => (
        <motion.button
          key={type.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onSelect(type.id)}
          className="flex items-center p-4 border rounded-lg hover:border-[#0125F0] hover:bg-blue-50 transition-colors text-left w-full"
        >
          <div className="p-2 bg-blue-100 rounded-lg text-[#0125F0]">
            {type.icon}
          </div>
          <div className="ml-4">
            <h3 className="font-semibold text-gray-900">{type.title}</h3>
            <p className="text-sm text-gray-600">{type.description}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}