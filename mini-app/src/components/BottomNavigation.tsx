import React from "react";
import { LayoutDashboard, PlusCircle, BarChart3, User } from "lucide-react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const handleTabClick = (tab: string) => {
    // Haptic Feedback
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
    }
    onTabChange(tab);
  };

  const navItems = [
    { id: "home", label: "Home", icon: LayoutDashboard },
    { id: "log", label: "Add Food", icon: PlusCircle, isCenter: true },
    { id: "stats", label: "Progress", icon: BarChart3 },
    { id: "profile", label: "Settings", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="bg-white/80 backdrop-blur-md border-t border-white/20 shadow-lg px-6 py-3 pb-8 flex justify-between items-center">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className="relative -top-6 bg-emerald-500 rounded-full w-14 h-14 flex items-center justify-center shadow-xl text-white hover:bg-emerald-600 transition-all active:scale-95"
              >
                <Icon size={28} />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center gap-1 transition-colors duration-200 ${
                isActive
                  ? "text-emerald-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span
                className={`text-[10px] font-medium ${isActive ? "text-emerald-600" : "text-slate-400"}`}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-2 w-1 h-1 bg-emerald-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
