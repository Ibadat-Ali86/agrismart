import { useState, useRef, useEffect } from "react";
import { AppHeaderBack } from "@/components/app/AppHeaderBack";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

export default function AiTools() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm your AgriSmart AI advisor. Ask me anything about crops, soil, pests, or markets." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const r = await api.ai.chat(msg, messages.slice(-8));
      setMessages((m) => [...m, { role: "assistant", content: r.reply }]);
    } catch (e: any) {
      toast.error(e.message);
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't respond. " + e.message }]);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <AppHeaderBack title="AI Advisor" />
      <div className="flex h-[calc(100vh-8rem)] flex-col p-4">
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary/10 to-soft-green p-3 text-sm">
          <Sparkles className="size-4 text-primary" /> Powered by AI · ask in any language
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-card p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>{m.content}</div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="rounded-2xl bg-muted px-4 py-2"><Loader2 className="size-4 animate-spin" /></div></div>}
          <div ref={endRef} />
        </div>
        <div className="mt-3 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask anything…" className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" />
          <Button onClick={send} disabled={loading} className="bg-primary hover:bg-primary-dark"><Send className="size-4" /></Button>
        </div>
      </div>
    </div>
  );
}
