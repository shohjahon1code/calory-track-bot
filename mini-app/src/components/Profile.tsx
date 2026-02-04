import React, { useState, useEffect } from "react";
import telegramService from "../utils/telegram";
import apiService from "../services/api";
import { User } from "../types";
import {
  ChevronRight,
  User as UserIcon,
  Crown,
  Activity,
  Target,
  Scale,
  Ruler,
  Settings,
  LogOut,
  AlertCircle,
  Languages,
} from "lucide-react";
import LoadingSkeleton from "./LoadingSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const Profile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    weight: "",
    height: "",
    age: "",
    gender: "male",
    activityLevel: "sedentary",
    dailyGoal: "",
    units: "metric",
    goal: "maintain",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDelete, setActiveDelete] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const tgId = telegramService.getUserId();
        if (tgId) {
          const userData = await apiService.getUser(tgId);
          setUser(userData);
          setFormData({
            weight: userData.weight?.toString() || "",
            height: userData.height?.toString() || "",
            age: userData.age?.toString() || "",
            gender: userData.gender || "male",
            activityLevel: userData.activityLevel || "sedentary",
            dailyGoal: userData.dailyGoal.toString(),
            units: userData.units || "metric",
            goal: userData.goal || "maintain",
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await apiService.updateProfile(user.tgId, {
        weight: Number(formData.weight),
        height: Number(formData.height),
        age: Number(formData.age),
        gender: formData.gender as "male" | "female",
        activityLevel: formData.activityLevel as any,
        goal: formData.goal as any,
        units: formData.units as "metric" | "imperial",
      });

      // Also update manual goal if changed
      if (Number(formData.dailyGoal) !== user.dailyGoal) {
        await apiService.updateGoal(user.tgId, Number(formData.dailyGoal));
      }

      telegramService.showAlert(t("common.save") + "!");
    } catch (error) {
      console.error("Error updating profile:", error);
      telegramService.showAlert(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    // In a real app, this would delete account
    setActiveDelete(false);
    telegramService.showAlert(
      "⚠️ " + t("profile.deleteAccount") + " requested.",
    );
  };

  if (loading) return <LoadingSkeleton />;

  const SectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4 mb-2 mt-6">
      {title}
    </h3>
  );

  const SettingRow = ({ icon: Icon, color, label, children }: any) => (
    <div className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={18} />
        </div>
        <span className="font-bold text-slate-700 text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* Header */}
      <div className="bg-white pt-6 pb-6 px-4 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden text-xl">
              {user?.gender === "female" ? "👩" : "👨"}
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-tight">
                {t("profile.title")}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                @{user?.username || "user"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold active:scale-95 transition-all shadow-md shadow-slate-200"
          >
            {saving ? t("common.loading") : t("common.save")}
          </button>
        </div>
      </div>

      <div className="px-4 mb-6 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => (window.location.href = "/?start_param=premium_view")}
          className="w-full p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-between cursor-pointer active:scale-98 transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Crown size={20} className="text-yellow-300" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">
                {t("premium.upgrade")}
              </h3>
              <p className="text-indigo-100 text-[10px] font-medium">
                {t("premium.features.unlimited")}
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-white/50" />
        </motion.div>
      </div>

      <div className="px-4">
        <SectionTitle title={t("profile.personalInfo")} />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <SettingRow
            icon={Scale}
            color="bg-blue-50 text-blue-500"
            label={t("stats.weight")}
          >
            <input
              name="weight"
              type="number"
              value={formData.weight}
              onChange={handleChange}
              className="w-16 text-right font-bold text-slate-800 bg-transparent outline-none placeholder:text-slate-300"
              placeholder="0"
            />
            <span className="text-xs font-bold text-slate-400 w-4">
              {formData.units === "metric" ? "kg" : "lbs"}
            </span>
          </SettingRow>

          <SettingRow
            icon={Ruler}
            color="bg-indigo-50 text-indigo-500"
            label="Height"
          >
            <input
              name="height"
              type="number"
              value={formData.height}
              onChange={handleChange}
              className="w-16 text-right font-bold text-slate-800 bg-transparent outline-none placeholder:text-slate-300"
              placeholder="0"
            />
            <span className="text-xs font-bold text-slate-400 w-4">cm</span>
          </SettingRow>

          <SettingRow
            icon={UserIcon}
            color="bg-purple-50 text-purple-500"
            label="Age"
          >
            <input
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              className="w-16 text-right font-bold text-slate-800 bg-transparent outline-none placeholder:text-slate-300"
              placeholder="0"
            />
            <span className="text-xs font-bold text-slate-400 w-4">yo</span>
          </SettingRow>

          <SettingRow
            icon={Languages}
            color="bg-emerald-50 text-emerald-500"
            label={t("profile.language")}
          >
            <select
              value={i18n.language}
              onChange={handleLanguageChange}
              className="bg-transparent text-right font-bold text-slate-700 text-xs outline-none appearance-none cursor-pointer pr-4"
            >
              <option value="en">English</option>
              <option value="uz">O'zbekcha</option>
            </select>
            <ChevronRight
              size={14}
              className="text-slate-300 absolute right-4 pointer-events-none"
            />
          </SettingRow>
        </motion.div>

        <SectionTitle title={t("profile.title")} />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <SettingRow
            icon={Activity}
            color="bg-orange-50 text-orange-500"
            label="Activity"
          >
            <select
              name="activityLevel"
              value={formData.activityLevel}
              onChange={handleChange}
              className="bg-transparent text-right font-bold text-slate-700 text-xs outline-none appearance-none cursor-pointer pr-4"
            >
              <option value="sedentary">Sedentary</option>
              <option value="light">Light Active</option>
              <option value="moderate">Moderate</option>
              <option value="active">Active</option>
              <option value="very_active">Very Active</option>
            </select>
            <ChevronRight
              size={14}
              className="text-slate-300 absolute right-4 pointer-events-none"
            />
          </SettingRow>

          <SettingRow
            icon={Target}
            color="bg-rose-50 text-rose-500"
            label={t("profile.dailyGoal")}
          >
            <div className="flex items-center bg-slate-50 rounded-lg px-2 py-1 border border-slate-200">
              <input
                name="dailyGoal"
                type="number"
                value={formData.dailyGoal}
                onChange={handleChange}
                className="w-14 text-right font-bold text-emerald-600 bg-transparent outline-none"
              />
              <span className="text-[10px] font-bold text-slate-400 ml-1">
                kcal
              </span>
            </div>
          </SettingRow>
        </motion.div>

        <div className="mt-8 mb-4">
          <button
            onClick={() => setActiveDelete(true)}
            className="w-full py-4 text-red-500 font-bold text-sm bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center gap-2 active:bg-red-100 transition-colors"
          >
            <LogOut size={16} /> {t("profile.deleteAccount")}
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-4 font-medium">
            version 1.2.0 • build 2024
          </p>
        </div>
      </div>

      <AnimatePresence>
        {activeDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-800 text-center mb-2">
                {t("profile.deleteAccount")}?
              </h3>
              <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
                {t("common.error")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveDelete(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm active:scale-95 transition-transform"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-red-200 active:scale-95 transition-transform"
                >
                  {t("profile.deleteAccount")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
