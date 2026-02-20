import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import telegramService from "../utils/telegram";
import apiService from "../services/api";
import { MoodEntry, MoodLevel, MoodTrigger } from "../types";

const MOOD_EMOJIS: { level: MoodLevel; emoji: string; labelKey: string }[] = [
  { level: 5, emoji: "\uD83D\uDE04", labelKey: "mood.great" },
  { level: 4, emoji: "\uD83D\uDE42", labelKey: "mood.good" },
  { level: 3, emoji: "\uD83D\uDE10", labelKey: "mood.normal" },
  { level: 2, emoji: "\uD83D\uDE1F", labelKey: "mood.bad" },
  { level: 1, emoji: "\uD83D\uDE29", labelKey: "mood.terrible" },
];

const TRIGGER_OPTIONS: { key: MoodTrigger; emoji: string; labelKey: string }[] = [
  { key: "stress", emoji: "\uD83D\uDE2B", labelKey: "mood.triggers.stress" },
  { key: "tired", emoji: "\uD83D\uDE34", labelKey: "mood.triggers.tired" },
  { key: "happy", emoji: "\uD83D\uDE0A", labelKey: "mood.triggers.happy" },
  { key: "energetic", emoji: "\u26A1", labelKey: "mood.triggers.energetic" },
  { key: "hungry", emoji: "\uD83C\uDF54", labelKey: "mood.triggers.hungry" },
  { key: "anxious", emoji: "\uD83D\uDE30", labelKey: "mood.triggers.anxious" },
  { key: "relaxed", emoji: "\uD83E\uDDD8", labelKey: "mood.triggers.relaxed" },
  { key: "sick", emoji: "\uD83E\uDD12", labelKey: "mood.triggers.sick" },
  { key: "exercise", emoji: "\uD83C\uDFCB\uFE0F", labelKey: "mood.triggers.exercise" },
  { key: "sleep_well", emoji: "\uD83C\uDF1F", labelKey: "mood.triggers.sleepWell" },
  { key: "sleep_bad", emoji: "\uD83D\uDE34", labelKey: "mood.triggers.sleepBad" },
];

interface MoodCardProps {
  existingMood?: MoodEntry | null;
  onMoodLogged?: () => void;
}

export default function MoodCard({ existingMood, onMoodLogged }: MoodCardProps) {
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(
    existingMood?.mood || null,
  );
  const [selectedTriggers, setSelectedTriggers] = useState<MoodTrigger[]>(
    existingMood?.triggers || [],
  );
  const [note, setNote] = useState(existingMood?.note || "");
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!existingMood);

  const handleMoodSelect = async (level: MoodLevel) => {
    setSelectedMood(level);
    telegramService.haptic("light");

    // Quick one-tap save (no expand)
    if (!expanded) {
      setSaving(true);
      const tgId = telegramService.getUserId();
      if (tgId) {
        try {
          await apiService.logMood(tgId, level, selectedTriggers, note);
          telegramService.haptic("success");
          setSaved(true);
          onMoodLogged?.();
        } catch (err) {
          console.error("Failed to log mood:", err);
        }
      }
      setSaving(false);
    }
  };

  const toggleTrigger = (trigger: MoodTrigger) => {
    telegramService.haptic("light");
    setSelectedTriggers((prev) =>
      prev.includes(trigger)
        ? prev.filter((t) => t !== trigger)
        : [...prev, trigger],
    );
  };

  const handleSaveDetailed = async () => {
    if (!selectedMood) return;
    setSaving(true);
    const tgId = telegramService.getUserId();
    if (tgId) {
      try {
        await apiService.logMood(tgId, selectedMood, selectedTriggers, note);
        telegramService.haptic("success");
        setSaved(true);
        setExpanded(false);
        onMoodLogged?.();
      } catch (err) {
        console.error("Failed to save detailed mood:", err);
      }
    }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800">
          {saved ? t("mood.todaysMood") : t("mood.howFeeling")}
        </h3>
        <div className="flex items-center gap-2">
          {saved && !expanded && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-500">
              <Check size={12} />
              {t("mood.saved")}
            </span>
          )}
          {selectedMood && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-slate-400 p-1 rounded-lg hover:bg-slate-50"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Emoji Row */}
      <div className="flex justify-between gap-1">
        {MOOD_EMOJIS.map(({ level, emoji, labelKey }) => (
          <motion.button
            key={level}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleMoodSelect(level)}
            disabled={saving}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 ${
              selectedMood === level
                ? "bg-emerald-50 border-2 border-emerald-200"
                : "bg-slate-50 border-2 border-transparent"
            }`}
          >
            <span className={`text-2xl transition-transform ${selectedMood === level ? "scale-110" : ""}`}>
              {emoji}
            </span>
            <span className={`text-[9px] font-medium ${
              selectedMood === level ? "text-emerald-600" : "text-slate-400"
            }`}>
              {t(labelKey)}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Expanded: Triggers + Note */}
      <AnimatePresence>
        {expanded && selectedMood && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Triggers */}
            <div className="mt-4">
              <span className="text-xs font-bold text-slate-500 mb-2 block">
                {t("mood.whatTriggered")}
              </span>
              <div className="flex flex-wrap gap-2">
                {TRIGGER_OPTIONS.map(({ key, emoji, labelKey }) => (
                  <button
                    key={key}
                    onClick={() => toggleTrigger(key)}
                    className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${
                      selectedTriggers.includes(key)
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    {emoji} {t(labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="mt-3">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("mood.notePlaceholder")}
                maxLength={200}
                className="w-full text-sm border border-slate-200 rounded-xl p-3 bg-slate-50 resize-none h-16 focus:outline-none focus:border-emerald-300 transition-colors"
              />
            </div>

            {/* Save Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveDetailed}
              disabled={saving}
              className="w-full mt-3 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 shadow-sm"
            >
              {saving ? "..." : t("common.save")}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
