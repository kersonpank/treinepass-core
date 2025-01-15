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
    title: "Individual",
    description: "Access multiple gyms with a single membership",
    icon: <User className="w-6 h-6" />,
  },
  {
    id: "business",
    title: "Business",
    description: "Provide gym access to your employees",
    icon: <Building2 className="w-6 h-6" />,
  },
  {
    id: "gym",
    title: "Gym",
    description: "Partner with us to reach more customers",
    icon: <Dumbbell className="w-6 h-6" />,
  },
];

interface UserTypeSelectProps {
  onSelect: (type: string) => void;
}

export const UserTypeSelect = ({ onSelect }: UserTypeSelectProps) => {
  return (
    <div className="grid gap-4">
      {userTypes.map((type, index) => (
        <motion.button
          key={type.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onSelect(type.id)}
          className="flex items-center p-4 border rounded-lg hover:border-primary hover:bg-primary-50 transition-colors"
        >
          <div className="p-2 bg-primary-100 rounded-lg text-primary">
            {type.icon}
          </div>
          <div className="ml-4 text-left">
            <h3 className="font-semibold text-gray-900">{type.title}</h3>
            <p className="text-sm text-gray-600">{type.description}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
};