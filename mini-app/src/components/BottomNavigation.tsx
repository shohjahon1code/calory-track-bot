import React from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, PlusCircle, BarChart3, Users, User } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "home", labelKey: "nav.home", icon: LayoutDashboard },
  { id: "stats", labelKey: "nav.stats", icon: BarChart3 },
  { id: "log", labelKey: "nav.addFood", icon: PlusCircle, isCenter: true },
  { id: "friends", labelKey: "nav.friends", icon: Users },
  { id: "profile", labelKey: "nav.profile", icon: User },
];

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { t } = useTranslation();

  const handleTabClick = (tab: string) => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
    }
    onTabChange(tab);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white/80 backdrop-blur-xl border-t border-slate-100/60 shadow-lg px-2 pt-2 pb-7 flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className="relative -top-5 gradient-primary rounded-full w-14 h-14 flex items-center justify-center shadow-xl shadow-brand-300/40 text-white active:scale-95 transition-transform duration-150"
              >
                <Icon size={26} strokeWidth={2.5} />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className="relative flex flex-col items-center gap-0.5 min-w-[56px] py-1 transition-colors duration-200"
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={isActive ? "text-brand-600" : "text-slate-400"}
                />
              </div>
              <span
                className={`text-[10px] font-semibold ${
                  isActive ? "text-brand-600" : "text-slate-400"
                }`}
              >
                {t(item.labelKey)}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-1 w-5 h-0.5 bg-brand-500 rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
