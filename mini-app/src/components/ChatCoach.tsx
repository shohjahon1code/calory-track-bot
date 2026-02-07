import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Bot, Crown, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import telegramService from "../utils/telegram";
import apiService from "../services/api";
import { ChatMessage } from "../types";

interface ChatCoachProps {
  onBack: () => void;
}

export default function ChatCoach({ onBack }: ChatCoachProps) {
  const { t, i18n } = useTranslation();
  const tgId = telegramService.getUserId();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load chat history + subscription
  useEffect(() => {
    if (!tgId) return;
    const load = async () => {
      try {
        const [history, sub] = await Promise.all([
          apiService.getChatHistory(tgId),
          apiService.getSubscription(tgId).catch(() => null),
        ]);
        setMessages(history);
        if (sub) setIsPremium(sub.isPremium);
      } catch (err) {
        console.error("Failed to load chat:", err);
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [tgId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing, scrollToBottom]);

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading || !tgId) return;

    setInput("");
    telegramService.haptic("light");

    // Optimistic add user message
    const userMsg: ChatMessage = {
      _id: `temp_${Date.now()}`,
      role: "user",
      content: msg,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);
    setLoading(true);

    try {
      const res = await apiService.sendChatMessage(tgId, msg, i18n.language);
      if (res.success && res.response) {
        const aiMsg: ChatMessage = {
          _id: `ai_${Date.now()}`,
          role: "assistant",
          content: res.response,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        telegramService.haptic("success");
      }
      if (res.remainingMessages !== undefined) {
        setRemaining(res.remainingMessages);
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        _id: `err_${Date.now()}`,
        role: "assistant",
        content: t("chatCoach.errorMessage"),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
      telegramService.haptic("error");
    } finally {
      setTyping(false);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const chips = [
    t("chatCoach.chip1"),
    t("chatCoach.chip2"),
    t("chatCoach.chip3"),
  ];

  const limitReached = remaining !== null && remaining <= 0 && !isPremium;

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 active:bg-slate-200 transition-colors"
        >
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-sm">
          <Bot size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-sm font-bold text-slate-800">{t("chatCoach.title")}</h1>
          <p className="text-[10px] text-slate-400">{t("chatCoach.subtitle")}</p>
        </div>
        {!isPremium && remaining !== null && (
          <span className="text-[10px] font-medium bg-amber-50 text-amber-600 px-2 py-1 rounded-full">
            {remaining}/{3}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {initialLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Welcome message if no history */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 items-start"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shrink-0 mt-1">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] shadow-sm border border-slate-100">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {t("chatCoach.welcomeMessage")}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Chat messages */}
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shrink-0 mt-1">
                      <Bot size={14} className="text-white" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 max-w-[80%] shadow-sm ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-cyan-500 to-blue-500 text-white rounded-tr-sm"
                        : "bg-white text-slate-700 rounded-tl-sm border border-slate-100"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[9px] mt-1.5 ${msg.role === "user" ? "text-white/50" : "text-slate-300"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {typing && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 items-start"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shrink-0 mt-1">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-100">
                  <div className="flex gap-1.5 items-center">
                    <span className="text-xs text-slate-400 mr-1">{t("chatCoach.typing")}</span>
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick chips (show only when no messages or few messages) */}
      {messages.length <= 1 && !typing && !initialLoading && (
        <div className="px-4 pb-2 shrink-0">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {chips.map((chip, i) => (
              <button
                key={i}
                onClick={() => sendMessage(chip)}
                disabled={loading || limitReached}
                className="whitespace-nowrap text-xs font-medium px-3.5 py-2 rounded-full bg-white border border-slate-200 text-slate-600 active:bg-slate-50 transition-colors shrink-0 disabled:opacity-40"
              >
                <Sparkles size={11} className="inline mr-1 text-cyan-400" />
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Limit banner */}
      {limitReached && (
        <div className="px-4 pb-2 shrink-0">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <Crown size={18} className="text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-700">{t("chatCoach.limitReached")}</p>
              <p className="text-[10px] text-amber-500 mt-0.5">{t("chatCoach.upgradePrompt")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-slate-100 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chatCoach.placeholder")}
            disabled={limitReached}
            className="flex-1 text-sm bg-slate-100 rounded-full px-4 py-2.5 outline-none placeholder:text-slate-400 disabled:opacity-50 transition-colors focus:bg-slate-50 focus:ring-2 focus:ring-cyan-200"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading || limitReached}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-sm active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
          >
            <Send size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
