"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import ErrorMessage from "@/components/ErrorMessage";
import Markdown from "@/components/Markdown";
import RequireAuth from "@/components/RequireAuth";
import Spinner from "@/components/Spinner";
import { formatDateTime, formatTime } from "@/lib/format";
import { getErrorMessage } from "@/services/api";
import {
  createConversation,
  deleteConversation,
  getConversation,
  getConversations,
  renameConversation,
  sendMessage,
} from "@/services/chatService";
import type { ChatMessage, Conversation } from "@/types";

const STARTERS = [
  "Plan a 5-day family trip to Japan with a budget of USD 2,000.",
  "I love anime, hidden cafés and photography. Where should I go in Tokyo?",
  "Suggest a romantic 3-day itinerary in Bali.",
];

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200" aria-label="Jalan-Jalan AI is typing">
        {[0, 1, 2].map((i) => (
          <span key={i} className="typing-dot h-2 w-2 rounded-full bg-teal-500" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser ? "rounded-br-sm bg-teal-600 text-white" : "rounded-bl-sm bg-white ring-1 ring-slate-200"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <Markdown className="prose-sm">{message.content}</Markdown>
        )}
        <p className={`mt-1 text-right text-[11px] ${isUser ? "text-teal-100" : "text-slate-400"}`}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}

function Chat() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedText, setFailedText] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const tempIdRef = useRef(0);

  const activeConversation = conversations?.find((c) => c.id === activeId) ?? null;

  const refreshConversations = useCallback(async () => {
    try {
      setConversations(await getConversations());
    } catch (err) {
      setError(getErrorMessage(err));
      setConversations((current) => current ?? []);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getConversations()
      .then((data) => !cancelled && setConversations(data))
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setConversations([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scroll to the latest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  async function openConversation(id: number) {
    setActiveId(id);
    setSidebarOpen(false);
    setError(null);
    setLoadingMessages(true);
    try {
      const detail = await getConversation(id);
      setMessages(detail.messages);
    } catch (err) {
      setError(getErrorMessage(err));
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }

  function startNewChat() {
    setActiveId(null);
    setMessages([]);
    setError(null);
    setSidebarOpen(false);
  }

  async function handleSend(text: string) {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    setFailedText(null);
    setInput("");

    const optimistic: ChatMessage = {
      id: -++tempIdRef.current,
      conversation_id: activeId ?? 0,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);

    let conversationId = activeId;
    try {
      if (conversationId === null) {
        const created = await createConversation();
        conversationId = created.id;
        setActiveId(created.id);
      }
      const result = await sendMessage(conversationId, content);
      setMessages((current) => [
        ...current.filter((m) => m.id !== optimistic.id),
        result.user_message,
        result.assistant_message,
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
      setFailedText(content);
      if (conversationId !== null) {
        // The backend stores the user message before calling Bedrock — resync with it.
        try {
          const detail = await getConversation(conversationId);
          setMessages(detail.messages);
        } catch {
          /* keep optimistic view */
        }
      }
    } finally {
      setSending(false);
      void refreshConversations();
    }
  }

  async function handleRename(id: number) {
    const title = renameValue.trim();
    setRenamingId(null);
    if (!title) return;
    try {
      const updated = await renameConversation(id, title);
      setConversations((current) => current?.map((c) => (c.id === id ? updated : c)) ?? null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this conversation?")) return;
    try {
      await deleteConversation(id);
      setConversations((current) => current?.filter((c) => c.id !== id) ?? null);
      if (activeId === id) startNewChat();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <button type="button" onClick={startNewChat}
        className="m-3 rounded-xl bg-teal-600 px-4 py-2.5 font-semibold text-white hover:bg-teal-700">
        ＋ New chat
      </button>
      <p className="px-4 pb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Conversations</p>
      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {conversations === null && <div className="py-6"><Spinner size="sm" /></div>}
        {conversations?.length === 0 && <p className="px-2 text-sm text-slate-400">No conversations yet.</p>}
        {conversations?.map((c) => (
          <div key={c.id}
            className={`group rounded-lg px-2 py-2 ${c.id === activeId ? "bg-teal-50 ring-1 ring-teal-200" : "hover:bg-slate-100"}`}>
            {renamingId === c.id ? (
              <form onSubmit={(e) => { e.preventDefault(); void handleRename(c.id); }}>
                <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => void handleRename(c.id)} aria-label="Conversation title"
                  className="w-full rounded border border-teal-300 px-2 py-1 text-sm focus:outline-none" />
              </form>
            ) : (
              <div className="flex items-start gap-1">
                <button type="button" onClick={() => void openConversation(c.id)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium text-slate-800">◌ {c.title}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(c.updated_at ?? c.created_at)}</p>
                </button>
                <div className="flex shrink-0 gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                  <button type="button" title="Rename" aria-label={`Rename ${c.title}`}
                    onClick={() => { setRenamingId(c.id); setRenameValue(c.title); }}
                    className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700">✎</button>
                  <button type="button" title="Delete" aria-label={`Delete ${c.title}`} onClick={() => void handleDelete(c.id)}
                    className="rounded p-1 text-slate-400 hover:bg-white hover:text-rose-600">✕</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-6xl">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white md:block">{sidebar}</aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" aria-label="Close conversations" className="absolute inset-0 bg-slate-900/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">{sidebar}</aside>
        </div>
      )}

      <section className="flex min-w-0 flex-1 flex-col bg-slate-50">
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg border border-slate-200 px-2 py-1 text-sm md:hidden">
            ☰ Chats
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-semibold text-slate-900">{activeConversation?.title ?? "Jalan-Jalan AI Chat"}</h1>
            <p className="text-xs text-slate-500">Jalan-Jalan AI remembers this conversation — ask follow-up questions naturally.</p>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
          {loadingMessages && <div className="py-10"><Spinner label="Loading messages..." /></div>}

          {!loadingMessages && messages.length === 0 && (
            <div className="mx-auto max-w-xl py-10 text-center">
              <p className="text-4xl" aria-hidden>💬</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">Start a conversation</h2>
              <p className="mt-1 text-slate-500">Ask Jalan-Jalan AI anything about your next trip.</p>
              <div className="mt-6 flex flex-col gap-2">
                {STARTERS.map((starter) => (
                  <button key={starter} type="button" onClick={() => void handleSend(starter)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 hover:border-teal-300">
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loadingMessages && messages.map((message) => <MessageBubble key={message.id} message={message} />)}
          {sending && <TypingIndicator />}
          {error && (
            <ErrorMessage title="Message not delivered" message={error}
              onRetry={failedText ? () => { const text = failedText; setFailedText(null); void handleSend(text); } : undefined} />
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); void handleSend(input); }}
          className="flex gap-2 border-t border-slate-200 bg-white p-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend(input);
              }
            }}
            rows={1}
            placeholder="Type a message... (Enter to send, Shift+Enter for a new line)"
            className="max-h-40 flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none"
          />
          <button type="submit" disabled={sending || !input.trim()}
            className="rounded-xl bg-teal-600 px-5 font-semibold text-white hover:bg-teal-700 disabled:opacity-50" aria-label="Send">
            ➤
          </button>
        </form>
      </section>
    </div>
  );
}

export default function ChatPage() {
  return (
    <RequireAuth>
      <Chat />
    </RequireAuth>
  );
}
