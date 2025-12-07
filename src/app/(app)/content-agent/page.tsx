"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  clearContentHistory,
  deleteContentThread,
  getContentHistory,
  sendContentMessage,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, RefreshCw, Sparkles } from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  message: string;
  created_at?: string;
};

type ContentHistoryRecord = {
  role?: string;
  message?: string;
  user_input?: string;
  assistant_output?: string;
  created_at?: string;
  timestamp?: string;
};

export default function ContentAgentPage() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  const loadHistory = async () => {
    if (!token) return;
    setInitialLoading(true);
    try {
      const historyResponse = await getContentHistory(token);
      const records: ContentHistoryRecord[] = Array.isArray(historyResponse)
        ? historyResponse
        : Array.isArray((historyResponse as { history?: ContentHistoryRecord[] })?.history)
          ? (historyResponse as { history?: ContentHistoryRecord[] }).history || []
          : Array.isArray((historyResponse as { conversations?: ContentHistoryRecord[] })?.conversations)
            ? (historyResponse as { conversations?: ContentHistoryRecord[] }).conversations || []
            : [];

      const flattened: ChatMessage[] = [];

      records.forEach((item) => {
        const created = item?.created_at || item?.timestamp;

        if (item?.user_input || item?.assistant_output) {
          if (item.user_input) {
            flattened.push({
              role: "user",
              message: String(item.user_input),
              created_at: created,
            });
          }
          if (item.assistant_output) {
            flattened.push({
              role: "assistant",
              message: String(item.assistant_output),
              created_at: created,
            });
          }
          return;
        }

        if (item?.role && item?.message) {
          flattened.push({
            role: item.role === "user" ? "user" : "assistant",
            message: String(item.message),
            created_at: created,
          });
        }
      });

      setMessages(flattened);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to load history.",
      );
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !input.trim()) return;
    setLoading(true);
    const userMessage: ChatMessage = {
      role: "user",
      message: input,
      created_at: new Date().toISOString(),
    };
    const newMessages: ChatMessage[] = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    try {
      const response = await sendContentMessage(token, {
        message: input,
        image: file || undefined,
      });
      const assistantMessage: ChatMessage = {
        role: "assistant",
        message: response.reply ?? "",
        created_at: new Date().toISOString(),
      };
      setMessages([
        ...newMessages,
        assistantMessage,
      ]);
      setFile(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Agent failed to respond.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!token) return;
    await clearContentHistory(token);
    setMessages([]);
    toast.success("History cleared");
  };

  const handleDeleteThread = async () => {
    if (!token) return;
    await deleteContentThread(token);
    setMessages([]);
    toast.success("Thread deleted");
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
              Content agent
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              AI promos & communications
            </h1>
            <p className="text-sm text-muted-foreground">
              Send briefs and optional receipt/product images to the FastAPI
              content agent. Ideal for promos, captions, and customer outreach.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadHistory}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Clear history
            </Button>
            <Button variant="destructive" onClick={handleDeleteThread}>
              Delete thread
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.4fr]">
        <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-4 w-4 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Conversation
            </h2>
          </div>
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {initialLoading && (
              <p className="text-sm text-muted-foreground">Loading history...</p>
            )}
            {!initialLoading && messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No conversation yet. Start with a brief: &quot;Buat caption
                Instagram untuk promo akhir pekan.&quot;
              </p>
            )}
            {messages.map((m, idx) => (
              <div
                key={`${m.created_at}-${idx}`}
                className={`rounded-xl border p-3 ${
                  m.role === "user"
                    ? "border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30"
                    : "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {m.role === "user" ? "You" : "Agent"}
                  </Badge>
                  {m.created_at && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleString("id-ID")}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                  {m.message}
                </p>
              </div>
            ))}
            {loading && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-200 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Agent is composing a reply...
                </div>
              </div>
            )}
          </div>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <Textarea
              placeholder="Brief the agent..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setFile(e.target.files ? e.target.files[0] : null)
                }
                className="w-auto"
              />
              {file && (
                <Badge variant="secondary" className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  {file.name}
                </Badge>
              )}
              <Button type="submit" disabled={loading || !input.trim()}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Prompts to try
            </h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Ringkas penjualan minggu ini dan beri ide promosi KUR.</li>
            <li>• Buat caption IG untuk produk terlaris bulan ini.</li>
            <li>• Susun pesan WA untuk follow-up pelanggan baru.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
