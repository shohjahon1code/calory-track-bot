import { useState, useEffect, lazy, Suspense } from "react";
import Dashboard from "./components/Dashboard";
import Stats from "./components/Stats";
import Profile from "./components/Profile";
import Premium from "./components/Premium";
import EditMeal from "./components/EditMeal";
import BottomNavigation from "./components/BottomNavigation";
import PageTransition from "./components/ui/PageTransition";
import { ToastProvider } from "./components/ui/Toast";
import ShimmerSkeleton from "./components/ui/ShimmerSkeleton";
import telegramService from "./utils/telegram";
import apiService from "./services/api";
import i18n from "./i18n";
import "./App.css";

const Friends = lazy(() => import("./components/Friends"));
const MealPlan = lazy(() => import("./components/MealPlan"));
const Recipes = lazy(() => import("./components/Recipes"));
const ChatCoach = lazy(() => import("./components/ChatCoach"));

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [editMealId, setEditMealId] = useState<string | null>(null);

  useEffect(() => {
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
      const tgId = telegramService.getUserId();
      if (tgId) {
        apiService.promptLog(tgId).catch(() => {});
      }
      telegramService.close();
      return;
    }
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Dashboard onTabChange={handleTabChange} />;
      case "stats":
        return <Stats />;
      case "profile":
        return <Profile onTabChange={handleTabChange} />;
      case "premium":
        return <Premium />;
      case "friends":
        return (
          <Suspense fallback={<ShimmerSkeleton variant="friends" />}>
            <Friends />
          </Suspense>
        );
      case "meal_plan":
        return (
          <Suspense fallback={<ShimmerSkeleton variant="mealPlan" />}>
            <MealPlan onTabChange={handleTabChange} />
          </Suspense>
        );
      case "recipes":
        return (
          <Suspense fallback={<ShimmerSkeleton variant="mealList" />}>
            <Recipes onTabChange={handleTabChange} />
          </Suspense>
        );
      case "chat_coach":
        return (
          <Suspense fallback={<ShimmerSkeleton variant="mealList" />}>
            <ChatCoach onBack={() => setActiveTab("home")} />
          </Suspense>
        );
      case "edit_meal":
        return editMealId ? (
          <EditMeal
            mealId={editMealId}
            onSave={() => setActiveTab("home")}
            onCancel={() => setActiveTab("home")}
          />
        ) : (
          <Dashboard onTabChange={handleTabChange} />
        );
      default:
        return <Dashboard onTabChange={handleTabChange} />;
    }
  };

  return (
    <ToastProvider>
      <div className={`app min-h-screen bg-surface-secondary text-slate-900 ${activeTab === "chat_coach" ? "" : "pb-20"}`}>
        <PageTransition activeKey={activeTab}>
          {renderContent()}
        </PageTransition>
        {activeTab !== "chat_coach" && (
          <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        )}
      </div>
    </ToastProvider>
  );
}

export default App;
