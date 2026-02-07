import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4"
      >
        <Icon size={28} className="text-slate-400" />
      </motion.div>
      <h3 className="text-base font-bold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-[240px]">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-brand mt-5 text-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
