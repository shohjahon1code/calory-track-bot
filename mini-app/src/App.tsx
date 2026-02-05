import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import Stats from "./components/Stats";
import Profile from "./components/Profile";
import Premium from "./components/Premium";
import EditMeal from "./components/EditMeal";
import BottomNavigation from "./components/BottomNavigation";
import telegramService from "./utils/telegram";
import apiService from "./services/api";
import i18n from "./i18n";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [editMealId, setEditMealId] = useState<string | null>(null);

  useEffect(() => {
    // Sync language from backend
    const syncLanguage = async () => {
      try {
        const tgId = telegramService.getUserId();
        if (!tgId) return;
        const userData = await apiService.getUser(tgId);
        if (userData.language && userData.language !== i18n.language) {
          i18n.changeLanguage(userData.language);
        }
      } catch (error) {
        console.error("Error syncing language:", error);
      }
    };
    syncLanguage();

    // Check if opened with start_param (from deep link or query param)
    const params = new URLSearchParams(window.location.search);
    const urlStartParam = params.get("start_param");
    const telegramStartParam =
      window.Telegram?.WebApp?.initDataUnsafe?.start_param;
    const startParam = urlStartParam || telegramStartParam;

    if (startParam) {
      if (startParam.startsWith("edit_meal_")) {
        const mealId = startParam.replace("edit_meal_", "");
        setEditMealId(mealId);
        setActiveTab("edit_meal");
      } else if (startParam === "premium_view") {
        setActiveTab("premium");
      }
    }
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab === "log") {
      // Close Mini App so user can send photo to bot
      telegramService.close();
      return;
    }
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Dashboard />;
      case "stats":
        return <Stats />;
      case "profile":
        return <Profile />;
      case "premium":
        return <Premium />;
      case "edit_meal": // Handle Edit Meal View
        return editMealId ? (
          <div className="bg-slate-50 min-h-screen">
            {/* Import assuming EditMeal is default export */}
            <EditMeal
              mealId={editMealId}
              onSave={() => setActiveTab("home")}
              onCancel={() => setActiveTab("home")}
            />
          </div>
        ) : (
          <Dashboard />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app min-h-screen bg-slate-50 text-slate-900 pb-20">
      {renderContent()}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

export default App;
