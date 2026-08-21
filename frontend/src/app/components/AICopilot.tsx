import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Bot } from "lucide-react";

interface AICopilotProps {
  appState: any;
}

export default function AICopilot({ appState }: AICopilotProps) {
  const [messages, setMessages] = useState<any[]>([
    {
      sender: "copilot",
      text: "Hello! I am your FinTwin Digital Twin Copilot. I have access to your simulated trajectories, assets, liabilities, and optimizer. Ask me anything about your financial future!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch("/api/users/1/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { sender: "copilot", text: data.reply }]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: "Sorry, I had trouble communicating with the digital twin engine. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white/5 border border-white/5 rounded-2xl overflow-hidden shadow-lg animate-fade-in">
      {/* Copilot Header */}
      <div className="bg-[#111822] px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#00dce5]" />
          <div>
            <h3 className="text-sm font-bold text-white">FinTwin AI Advisor</h3>
            <p className="text-[10px] text-white/40">Powered by Gemini & Simulation Engine Tool Calling</p>
          </div>
        </div>
      </div>

      {/* Messages Logs Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {messages.map((msg, idx) => {
          const isCopilot = msg.sender === "copilot";
          return (
            <div key={idx} className={`flex items-start gap-3 ${!isCopilot && "flex-row-reverse"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCopilot ? "bg-[#00dce5]/10 text-[#00dce5]" : "bg-[#d1bcff]/10 text-[#d1bcff]"}`}>
                {isCopilot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`max-w-[70%] p-4 rounded-2xl border text-xs leading-relaxed whitespace-pre-wrap ${
                isCopilot
                  ? "bg-[#111822]/60 border-white/5 text-white/95 rounded-tl-none"
                  : "bg-[#d1bcff]/5 border-[#d1bcff]/20 text-[#d1bcff] rounded-tr-none"
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#00dce5]/10 text-[#00dce5] flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#111822]/60 border border-white/5 p-4 rounded-2xl rounded-tl-none text-xs text-white/40 animate-pulse font-mono">
              [ Engine computing outputs, Gemini compiling response... ]
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input form */}
      <form onSubmit={handleSend} className="bg-[#111822] p-4 border-t border-white/5 flex gap-3">
        <input
          type="text"
          placeholder="Ask a question about your plan (e.g. 'Run a market crash stress test' or 'Am I on track for retirement?')"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#00dce5]"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-[#00dce5] hover:bg-[#00c5cd] text-[#0b0f14] p-2.5 rounded-xl transition-all disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
