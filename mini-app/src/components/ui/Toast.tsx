import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, Flame, Trophy, X } from "lucide-react";
import telegramService from "../../utils/telegram";

type ToastType = "success" | "error" | "info" | "streak" | "badge";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  streak: Flame,
  badge: Trophy,
};

const TOAST_STYLES: Record<ToastType, string> = {
  success: "border-l-4 border-l-emerald-500",
  error: "border-l-4 border-l-rose-500",
  info: "border-l-4 border-l-blue-500",
  streak: "border-l-4 border-l-amber-500",
  badge: "border-l-4 border-l-indigo-500",
};

const ICON_COLORS: Record<ToastType, string> = {
  success: "text-emerald-500",
  error: "text-rose-500",
  info: "text-blue-500",
  streak: "text-amber-500",
  badge: "text-indigo-500",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const show = useCallback((message: string, type: ToastType = "success", duration = 3000) => {
    const id = `toast-${++counterRef.current}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    telegramService.haptic("light");

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = TOAST_ICONS[toast.type];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`toast ${TOAST_STYLES[toast.type]}`}
              >
                <Icon size={18} className={ICON_COLORS[toast.type]} />
                <span className="flex-1 text-sm font-medium text-slate-700">{toast.message}</span>
                <button onClick={() => dismiss(toast.id)} className="text-slate-300 hover:text-slate-500">
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
