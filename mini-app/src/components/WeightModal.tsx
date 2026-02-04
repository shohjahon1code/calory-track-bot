import React, { useState } from "react";
import { X, Save } from "lucide-react";

interface WeightModalProps {
  currentWeight: number;
  onSave: (weight: number) => void;
  onClose: () => void;
}

const WeightModal: React.FC<WeightModalProps> = ({
  currentWeight,
  onSave,
  onClose,
}) => {
  const [weight, setWeight] = useState(currentWeight.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numWeight = parseFloat(weight);
    if (!isNaN(numWeight) && numWeight > 0) {
      onSave(numWeight);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl scale-in-95 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Log Weight</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center items-end gap-2">
            <input
              autoFocus
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="text-5xl font-bold text-slate-800 text-center bg-transparent border-b-2 border-emerald-100 focus:border-emerald-500 outline-none w-32 py-2 transition-colors"
            />
            <span className="text-slate-400 font-medium mb-4 text-lg">kg</span>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Update
          </button>
        </form>
      </div>
    </div>
  );
};

export default WeightModal;
