import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Trophy, Flame, Zap, Share2, UserPlus, Check, X, Copy,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import telegramService from "../utils/telegram";
import apiService from "../services/api";
import SegmentedControl from "./ui/SegmentedControl";
import BottomSheet from "./ui/BottomSheet";
import EmptyState from "./ui/EmptyState";

interface LeaderboardEntry {
  tgId: string;
  firstName: string;
  username: string;
  currentStreak: number;
  level: number;
  weeklyCalories: number;
  weeklyGoalRate: number;
  rank: number;
  isCurrentUser: boolean;
}

interface FriendRequest {
  fromTgId: string;
  fromFirstName: string;
  fromUsername: string;
}

const PODIUM_COLORS = [
  "from-amber-400 to-yellow-500",   // gold
  "from-slate-300 to-slate-400",    // silver
  "from-amber-600 to-orange-700",   // bronze
];

const Friends: React.FC = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const tgId = telegramService.getUserId();
      if (!tgId) return;

      const [lb, req, ref] = await Promise.all([
        apiService.getLeaderboard(tgId),
        apiService.getPendingRequests(tgId),
        apiService.getReferralCode(tgId),
      ]);

      setLeaderboard(lb);
      setRequests(req);
      setReferralCode(ref.referralCode);
      setReferralLink(ref.link);
    } catch (error) {
      console.error("Error fetching friends data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendRequest = async () => {
    if (!searchInput.trim()) return;
    const tgId = telegramService.getUserId();
    if (!tgId) return;

    setSending(true);
    try {
      const result = await apiService.sendFriendRequest(tgId, searchInput.trim());
      if (result.success) {
        telegramService.haptic("success");
        setSearchInput("");
        setShowAddSheet(false);
      } else {
        telegramService.showAlert(result.message);
      }
    } catch (error) {
      console.error("Error sending request:", error);
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (friendTgId: string) => {
    const tgId = telegramService.getUserId();
    if (!tgId) return;

    try {
      await apiService.acceptFriendRequest(tgId, friendTgId);
      telegramService.haptic("success");
      setRequests(prev => prev.filter(r => r.fromTgId !== friendTgId));
      fetchData();
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    telegramService.haptic("light");
  };

  const handleShare = () => {
    if (referralLink) {
      telegramService.shareUrl(referralLink);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 pt-6 pb-24">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-100 rounded-xl w-32" />
          <div className="h-10 bg-slate-100 rounded-xl" />
          <div className="h-48 bg-slate-100 rounded-2xl" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen pb-24 bg-slate-50/50">
      {/* Header */}
      <div className="pt-6 px-4 pb-4 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black text-slate-800">{t("friends.title")}</h1>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="p-2 bg-slate-100 rounded-xl text-slate-500"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={() => setShowAddSheet(true)}
              className="p-2 gradient-primary rounded-xl text-white shadow-sm"
            >
              <UserPlus size={18} />
            </button>
          </div>
        </div>

        <SegmentedControl
          options={[t("friends.leaderboard"), t("friends.friendsList")]}
          selected={tab}
          onChange={setTab}
        />
      </div>

      {/* Pending Requests */}
      {requests.length > 0 && (
        <div className="px-4 py-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            {t("friends.pendingRequests")} ({requests.length})
          </h3>
          <div className="space-y-2">
            {requests.map((req) => (
              <motion.div
                key={req.fromTgId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl p-3 border border-slate-100 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-500">
                  {req.fromFirstName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{req.fromFirstName}</p>
                  {req.fromUsername && (
                    <p className="text-[10px] text-slate-400">@{req.fromUsername}</p>
                  )}
                </div>
                <button
                  onClick={() => handleAccept(req.fromTgId)}
                  className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600"
                >
                  <Check size={16} />
                </button>
                <button className="p-1.5 rounded-lg bg-slate-100 text-slate-400">
                  <X size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === 0 ? (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-3"
          >
            {leaderboard.length === 0 ? (
              <EmptyState
                icon={Users}
                title={t("friends.noFriends")}
                description={t("friends.noFriendsDesc")}
                action={{ label: t("friends.addFriend"), onClick: () => setShowAddSheet(true) }}
              />
            ) : (
              <>
                {/* Top 3 Podium */}
                {top3.length > 0 && (
                  <div className="flex items-end justify-center gap-3 mb-6 pt-4">
                    {/* 2nd place */}
                    {top3[1] && (
                      <PodiumCard entry={top3[1]} gradient={PODIUM_COLORS[1]} height="h-24" />
                    )}
                    {/* 1st place */}
                    {top3[0] && (
                      <PodiumCard entry={top3[0]} gradient={PODIUM_COLORS[0]} height="h-32" crown />
                    )}
                    {/* 3rd place */}
                    {top3[2] && (
                      <PodiumCard entry={top3[2]} gradient={PODIUM_COLORS[2]} height="h-20" />
                    )}
                  </div>
                )}

                {/* Rest of leaderboard */}
                <div className="space-y-2">
                  {rest.map((entry) => (
                    <motion.div
                      key={entry.tgId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white rounded-xl p-3 border flex items-center gap-3 ${
                        entry.isCurrentUser ? "border-indigo-200 bg-indigo-50/30" : "border-slate-100"
                      }`}
                    >
                      <span className="text-sm font-black text-slate-300 w-6 text-center">
                        {entry.rank}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">
                        {entry.firstName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {entry.firstName}
                          {entry.isCurrentUser && (
                            <span className="text-[10px] ml-1 text-indigo-500 font-bold">({t("friends.you")})</span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-0.5">
                            <Flame size={10} className="text-orange-400" /> {entry.currentStreak}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Zap size={10} className="text-indigo-400" /> Lv.{entry.level}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-emerald-500">{entry.weeklyGoalRate}%</span>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="friends"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-3"
          >
            {/* Referral code card */}
            {referralCode && (
              <div className="bg-white rounded-2xl p-4 border border-slate-100 mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t("friends.yourCode")}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-50 rounded-xl px-4 py-2.5 font-mono text-lg font-black text-slate-800 text-center tracking-widest">
                    {referralCode}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-2.5 rounded-xl bg-slate-100 text-slate-500"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2.5 rounded-xl gradient-primary text-white shadow-sm"
                  >
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            )}

            {leaderboard.filter(e => !e.isCurrentUser).length === 0 ? (
              <EmptyState
                icon={Users}
                title={t("friends.noFriends")}
                description={t("friends.noFriendsDesc")}
                action={{ label: t("friends.addFriend"), onClick: () => setShowAddSheet(true) }}
              />
            ) : (
              <div className="space-y-2">
                {leaderboard.filter(e => !e.isCurrentUser).map((entry) => (
                  <motion.div
                    key={entry.tgId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-3 border border-slate-100 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-base font-bold text-slate-500">
                      {entry.firstName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{entry.firstName}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="flex items-center gap-0.5">
                          <Flame size={10} className="text-orange-400" /> {entry.currentStreak}d streak
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Zap size={10} className="text-indigo-400" /> Lv.{entry.level}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-500">{entry.weeklyGoalRate}%</p>
                      <p className="text-[10px] text-slate-400">{t("friends.goalRate")}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Friend Bottom Sheet */}
      <BottomSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)} title={t("friends.addFriend")}>
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("friends.searchByUsername")}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
            />
          </div>
          <button
            onClick={handleSendRequest}
            disabled={!searchInput.trim() || sending}
            className="btn-brand w-full disabled:opacity-50"
          >
            {sending ? "..." : t("friends.addFriend")}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};

// Podium card for top 3
const PodiumCard: React.FC<{
  entry: LeaderboardEntry;
  gradient: string;
  height: string;
  crown?: boolean;
}> = ({ entry, gradient, height, crown }) => {
  return (
    <div className="flex flex-col items-center w-24">
      <div className="relative mb-2">
        {crown && (
          <Trophy size={16} className="text-amber-400 absolute -top-5 left-1/2 -translate-x-1/2" />
        )}
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-base shadow-lg`}>
          {entry.firstName.charAt(0)}
        </div>
      </div>
      <p className="text-[11px] font-bold text-slate-800 truncate max-w-full">{entry.firstName}</p>
      <p className="text-[10px] font-bold text-emerald-500">{entry.weeklyGoalRate}%</p>
      <div className={`w-full ${height} bg-gradient-to-t ${gradient} rounded-t-xl mt-2 flex items-center justify-center`}>
        <span className="text-white/80 text-lg font-black">#{entry.rank}</span>
      </div>
    </div>
  );
};

export default Friends;
