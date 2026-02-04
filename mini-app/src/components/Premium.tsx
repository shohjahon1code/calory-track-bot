import React, { useState, useEffect } from "react";
import telegramService from "../utils/telegram";
import apiService from "../services/api";
import {
  Crown,
  Loader2,
  Wallet,
  History,
  Zap,
  Check,
  Headset,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const Premium: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"plans" | "contact">("plans");
  const [selectedPlan, setSelectedPlan] = useState("1_year");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  const PLANS = [
    {
      id: "1_month",
      name: "1 " + t("common.month", { defaultValue: "Month" }),
      price: 29000,
      save: null,
      features: [
        t("premium.features.unlimited"),
        t("premium.features.insights"),
        t("premium.features.noAds"),
      ],
      bestValue: false,
      color: "from-blue-500 to-indigo-600",
    },
    {
      id: "6_months",
      name: "6 " + t("common.months", { defaultValue: "Months" }),
      price: 129000,
      save: t("premium.savePercent", {
        percent: "25%",
        defaultValue: "SAVE 25%",
      }),
      features: [
        t("premium.features.allMonthly", {
          defaultValue: "All Monthly Features",
        }),
        t("premium.features.support"),
        t("premium.features.earlyAccess", { defaultValue: "Early Access" }),
      ],
      bestValue: false,
      color: "from-purple-500 to-pink-600",
    },
    {
      id: "1_year",
      name: "1 " + t("common.year", { defaultValue: "Year" }),
      price: 199000,
      save: t("premium.bestValue", { defaultValue: "BEST VALUE" }),
      features: [
        t("premium.features.allFeatures", { defaultValue: "All Features" }),
        t("premium.features.freeMonths", {
          count: 2,
          defaultValue: "2 Months Free",
        }),
        t("premium.features.vipBadge", { defaultValue: "VIP Badge" }),
      ],
      bestValue: true,
      color: "from-amber-400 to-orange-500",
    },
  ];

  const tgId = telegramService.getUserId();

  const fetchSubscription = async () => {
    try {
      if (tgId) {
        const data = await apiService.getSubscription(tgId);
        setBalance(data.balance);
        setIsPremium(data.isPremium);
        setPremiumUntil(data.premiumUntil || null);
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Error fetching subs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [tgId]);

  const handlePurchase = async () => {
    const plan = PLANS.find((p) => p.id === selectedPlan);
    if (!plan) return;

    if (balance < plan.price) {
      setActiveTab("contact");
      return;
    }

    if (
      !(await telegramService.showConfirm(
        t("premium.confirmPurchase", {
          plan: plan.name,
          price: plan.price.toLocaleString(),
          defaultValue: `Purchase ${plan.name} for ${plan.price.toLocaleString()} UZS?`,
        }),
      ))
    ) {
      return;
    }

    setProcessing(true);
    try {
      if (tgId) {
        await apiService.purchasePlan(tgId, plan.id);
        telegramService.showAlert(
          "✅ " +
            t("premium.successUpgrade", {
              defaultValue: "Successfully Upgraded!",
            }),
        );
        fetchSubscription();
      }
    } catch (error: any) {
      console.error(error);
      telegramService.showAlert(
        "❌ " +
          t("premium.purchaseFailed", { defaultValue: "Purchase failed" }) +
          ": " +
          (error.response?.data?.error || t("common.error")),
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    );

  const selectedPlanDetails = PLANS.find((p) => p.id === selectedPlan);
  const canAfford = selectedPlanDetails
    ? balance >= selectedPlanDetails.price
    : false;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative overflow-hidden font-sans">
      {/* New Header Style */}
      <div className="bg-slate-900 text-white rounded-b-[2rem] p-6 pt-10 shadow-2xl shadow-slate-900/20 relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              {t("premium.title")}
            </h1>
            <p className="text-slate-400 text-xs font-medium">
              {t("premium.manage")}
            </p>
          </div>
          <div className="bg-slate-800/50 p-2 rounded-xl backdrop-blur-md border border-slate-700/50">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
              {t("premium.balance")}
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-black text-lg">
              <Wallet size={16} />
              {balance.toLocaleString()}
              <span className="text-[10px] self-end mb-1">UZS</span>
            </div>
          </div>
        </div>

        {/* Active Plan Card */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-2xl relative overflow-hidden shadow-lg shadow-indigo-500/30">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Crown size={100} />
          </div>
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded text-white backdrop-blur-sm">
                  {isPremium ? t("premium.proActive") : t("premium.freePlan")}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                {isPremium ? "Premium Member" : "Basic Access"}
              </h2>
              <p className="text-[10px] text-indigo-100 font-medium opacity-80">
                {isPremium && premiumUntil
                  ? `Expires on ${new Date(premiumUntil).toLocaleDateString()}`
                  : t("premium.upgradePrompt", {
                      defaultValue: "Upgrade to unlock all features",
                    })}
              </p>
            </div>
            {!isPremium && (
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Zap className="text-yellow-300 fill-yellow-300" size={20} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-4 gap-2">
        <button
          onClick={() => setActiveTab("plans")}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "plans" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:bg-slate-100"}`}
        >
          {t("premium.plans")}
        </button>
        <button
          onClick={() => setActiveTab("contact")}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "contact" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:bg-slate-100"}`}
        >
          {t("premium.contactSupport")}
        </button>
      </div>

      <div className="px-4 pb-4">
        <AnimatePresence mode="wait">
          {activeTab === "plans" ? (
            <motion.div
              key="plans"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-3">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
                      selectedPlan === plan.id
                        ? "border-indigo-500 bg-white shadow-xl shadow-indigo-100 scale-[1.02]"
                        : "border-transparent bg-white shadow-sm hover:scale-[1.01]"
                    }`}
                  >
                    {selectedPlan === plan.id && (
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${plan.color}`}
                      />
                    )}
                    {plan.save && (
                      <div
                        className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold text-white bg-gradient-to-r ${plan.color}`}
                      >
                        {plan.save}
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-2 pl-2">
                      <h3 className="font-bold text-slate-800 text-lg">
                        {plan.name}
                      </h3>
                      <div className="text-right">
                        <div className="font-black text-slate-900">
                          {plan.price.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">
                          UZS
                        </div>
                      </div>
                    </div>
                    <div className="pl-2 space-y-1">
                      {plan.features.slice(0, 2).map((feat, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs text-slate-500 font-medium"
                        >
                          <Check size={12} className="text-emerald-500" />{" "}
                          {feat}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="mt-8 mb-4">
                <button
                  onClick={
                    canAfford
                      ? handlePurchase
                      : () => {
                          setActiveTab("contact");
                        }
                  }
                  disabled={processing}
                  className={`w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    canAfford
                      ? "bg-slate-900 hover:bg-slate-800"
                      : "bg-indigo-600 hover:bg-indigo-500"
                  }`}
                >
                  {processing ? (
                    <Loader2 className="animate-spin" />
                  ) : canAfford ? (
                    "Purchase Plan"
                  ) : (
                    t("premium.contactSupport")
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="contact"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Headset className="text-indigo-600" size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  Contact Support to Upgrade
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Online payments are coming soon! For now, please contact our
                  admin to purchase a plan manually.
                </p>

                <button
                  onClick={() =>
                    telegramService.openLink("https://t.me/shohjahon1code")
                  }
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200"
                >
                  <MessageCircle size={20} />
                  Contact @shohjahon1code
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8 opacity-50 grayscale pointer-events-none select-none relative">
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                  <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    {t("common.comingSoon")}
                  </span>
                </div>
                <button
                  disabled
                  className="py-4 bg-slate-100 rounded-xl font-bold flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-slate-400 font-extrabold text-lg">
                    Click
                  </span>
                </button>
                <button
                  disabled
                  className="py-4 bg-indigo-50 rounded-xl font-bold flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-indigo-300 font-extrabold text-lg">
                    Payme
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transaction History Section */}
        <div className="mt-8">
          <div className="flex items-center gap-2 px-2 mb-4">
            <History size={14} className="text-slate-400" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Recent Activity
            </h3>
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {transactions.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                No transactions yet
              </div>
            ) : (
              transactions.map((tx: any) => (
                <div
                  key={tx._id}
                  className="p-4 border-b border-slate-50 last:border-0 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${tx.type === "deposit" ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"}`}
                    >
                      {tx.type === "deposit" ? (
                        <Wallet size={14} />
                      ) : (
                        <Zap size={14} />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-700 text-sm capitalize">
                        {tx.type === "subscription_purchase"
                          ? "Plan Purchase"
                          : tx.type}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {new Date(tx.createdAt).toLocaleDateString()} •{" "}
                        {tx.provider}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`font-black text-sm ${tx.type === "deposit" ? "text-emerald-500" : "text-rose-500"}`}
                  >
                    {tx.type === "deposit" ? "+" : ""}
                    {tx.amount.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Premium;
