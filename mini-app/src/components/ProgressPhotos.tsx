import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Trash2,  ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import telegramService from "../utils/telegram";
import apiService from "../services/api";
import { ProgressPhoto } from "../types";

interface ProgressPhotosProps {
  photos: ProgressPhoto[];
  comparison: { before: ProgressPhoto; after: ProgressPhoto } | null;
  onRefresh: () => void;
}

export default function ProgressPhotos({ photos, comparison, onRefresh }: ProgressPhotosProps) {
  const { t } = useTranslation();
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);

  const handleDelete = async (photoId: string) => {
    const confirmed = await telegramService.showConfirm(t("progressPhotos.deleteConfirm"));
    if (!confirmed) return;
    try {
      const tgId = telegramService.getUserId();
      if (tgId) {
        await apiService.deleteProgressPhoto(photoId, tgId);
        telegramService.haptic("success");
        onRefresh();
      }
    } catch (err) {
      console.error("Delete photo error:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  if (photos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center mx-auto mb-3">
          <Camera size={24} className="text-violet-400" />
        </div>
        <h3 className="text-sm font-bold text-slate-700 mb-1">{t("progressPhotos.empty")}</h3>
        <p className="text-xs text-slate-400">{t("progressPhotos.emptyDesc")}</p>
      </motion.div>
    );
  }

  const weightChange = comparison
    ? ((comparison.after.weight || 0) - (comparison.before.weight || 0)).toFixed(1)
    : null;
  const weightChangeNum = weightChange ? parseFloat(weightChange) : 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          {t("progressPhotos.title")}
          <span className="text-[10px] font-medium bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full">
            {photos.length}
          </span>
        </h3>
        <p className="text-[10px] text-slate-400">{t("progressPhotos.sendPhotoHint")}</p>
      </div>

      {/* Before / After Comparison */}
      {comparison && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="px-4 py-3 flex items-center justify-between border-b border-slate-50">
            <h4 className="text-xs font-bold text-slate-700">{t("progressPhotos.beforeAfter")}</h4>
            {weightChange && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                weightChangeNum < 0
                  ? "bg-emerald-50 text-emerald-600"
                  : weightChangeNum > 0
                    ? "bg-red-50 text-red-500"
                    : "bg-slate-50 text-slate-500"
              }`}>
                {weightChangeNum < 0 ? <ArrowDownRight size={12} /> : weightChangeNum > 0 ? <ArrowUpRight size={12} /> : null}
                {t("progressPhotos.weightChange", { change: weightChange })}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-0.5 bg-slate-100">
            {[comparison.before, comparison.after].map((photo, i) => (
              <div key={photo._id} className="relative bg-white">
                <img
                  src={photo.imageUrl}
                  alt={i === 0 ? "Before" : "After"}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-[10px] text-white/80 font-medium">{formatDate(photo.takenAt)}</p>
                  {photo.weight && (
                    <p className="text-sm font-bold text-white">{photo.weight} kg</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {photos.map((photo, i) => (
          <motion.div
            key={photo._id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedPhoto(photo)}
            className="shrink-0 w-24 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-24 h-28 rounded-xl overflow-hidden shadow-sm border border-slate-100">
              <img
                src={photo.imageUrl}
                alt="Progress"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1.5 text-center">
              {formatDate(photo.takenAt)}
            </p>
            {photo.weight && (
              <p className="text-[10px] text-slate-600 font-bold text-center">{photo.weight} kg</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Photo detail modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl"
            >
              <img
                src={selectedPhoto.imageUrl}
                alt="Progress"
                className="w-full h-72 object-cover"
              />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {formatDate(selectedPhoto.takenAt)}
                    </p>
                    {selectedPhoto.weight && (
                      <p className="text-xs text-slate-500 mt-0.5">{selectedPhoto.weight} kg</p>
                    )}
                    {selectedPhoto.note && (
                      <p className="text-xs text-slate-400 mt-1">{selectedPhoto.note}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      handleDelete(selectedPhoto._id);
                      setSelectedPhoto(null);
                    }}
                    className="p-2.5 text-red-400 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
