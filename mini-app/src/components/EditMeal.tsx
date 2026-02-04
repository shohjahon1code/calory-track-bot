import React, { useState, useEffect } from "react";
import apiService from "../services/api";
import telegramService from "../utils/telegram";
import { ArrowLeft, Save } from "lucide-react";

interface EditMealProps {
  mealId: string;
  onSave: () => void;
  onCancel: () => void;
}

const EditMeal: React.FC<EditMealProps> = ({ mealId, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch meal details
    // Currently apiService.getMealById doesn't exist, need to implement or mock
    // For MVP, we might need a new endpoint or pass data if available.
    // Let's assume we fetch by ID.
    const fetchMeal = async () => {
      try {
        // WORKAROUND: Since we don't have getMealById yet, we rely on parent or fetch today's and find?
        // Better: Implement getMeal(id) in API.
        // For now, let's try to mock or impl in API.
        const meal = await apiService.getMealById(mealId); // Will error if not added
        if (meal) {
          setFormData({
            name: meal.name,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
          });
        }
      } catch (error) {
        console.error("Error fetching meal:", error);
        telegramService.showAlert("❌ Error loading meal");
      } finally {
        setLoading(false);
      }
    };
    fetchMeal();
  }, [mealId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "name" ? value : Number(value),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.updateMeal(mealId, formData); // Implement this
      telegramService.showAlert("✅ Meal updated!");
      onSave();
    } catch (error) {
      console.error("Error updating meal:", error);
      telegramService.showAlert("❌ Failed to update meal");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onCancel}
          className="p-2 bg-white rounded-full shadow text-slate-600"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Edit Meal</h1>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Food Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Calories
            </label>
            <input
              type="number"
              name="calories"
              value={formData.calories}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Protein (g)
            </label>
            <input
              type="number"
              name="protein"
              value={formData.protein}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Carbs (g)
            </label>
            <input
              type="number"
              name="carbs"
              value={formData.carbs}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Fats (g)
            </label>
            <input
              type="number"
              name="fats"
              value={formData.fats}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        {saving ? (
          "Saving..."
        ) : (
          <>
            <Save size={20} /> Save Changes
          </>
        )}
      </button>
    </div>
  );
};

export default EditMeal;
