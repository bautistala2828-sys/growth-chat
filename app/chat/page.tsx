"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const [email] = useState("bautista@growthlarriera.com"); // si ya lo tenés desde supabase, después lo conectamos
  const [threads, setThreads] = useState<{ id: string; title: string; last: string }[]>([
    { id: "t1", title: "Nuevo cliente", last: "Estructura recomendada…" },
  ]);
  const [activeThreadId, setActiveThreadId] = useState("t1");

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Decime el objetivo (ventas/leads) + rubro + país + ticket promedio. Respondo con estructura recomendada y próximos pasos.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? threads[0],
    [threads, activeThreadId]
  );

  useEffect(() => {
    // auto scroll abajo
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function newChat() {
    const id = `t${Date.now()}`;
    setThreads((prev) => [{ id, title: "Nuevo chat", last: "—" }, ...prev]);
    setActiveThreadId(id);
    setMessages([
      {
        role: "assistant",
        content:
          "Decime el objetivo (ventas/leads) + rubro + país + ticket promedio. Respondo con estructura recomendada y próximos pasos.",
      },
    ]);
    setInput("");
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");

      const answer = data?.text || "Sin respuesta.";
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);

      // actualizar preview en sidebar
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? {
                ...t,
                title: t.title === "Nuevo chat" ? text.slice(0, 28) : t.title,
                last: answer.slice(0, 40),
              }
            : t
        )
      );
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${e?.message || "No se pudo conectar a la API."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-shell">
      <aside className="chat-sidebar">
        <div className="chat-brand">
          <span className="chat-dot" />
          <div>
            <h3>Mr. Larriera</h3>
            <p>Internal Advisor</p>
          </div>
        </div>

        <button className="chat-new" onClick={newChat}>
          + Nuevo chat
        </button>

        <div className="chat-list">
          {threads.map((t) => (
            <div
              key={t.id}
              className="chat-item"
              onClick={() => setActiveThreadId(t.id)}
              style={{
                outline: t.id === activeThreadId ? "2px solid rgba(255,168,213,.45)" : "none",
              }}
            >
              <strong>{t.title}</strong>
              <span>{t.last}</span>
            </div>
          ))}
        </div>
      </aside>

      <section className="chat-main">
        <header className="chat-topbar">
          <div className="meta">
            <strong>{activeThread?.title || "Mr. Larriera"}</strong>
            <span>{email}</span>
          </div>

          <button className="chat-logout" onClick={() => (window.location.href = "/")}>
            Salir
          </button>
        </header>

        <div className="chat-messages" ref={scrollerRef}>
          {messages.map((m, idx) => (
            <div key={idx} className={`msg ${m.role === "user" ? "user" : "assistant"}`}>
              <div className="avatar">{m.role === "user" ? "B" : "M"}</div>
              <div className="bubble">{m.content}</div>
            </div>
          ))}

          {loading && (
            <div className="msg assistant">
              <div className="avatar">M</div>
              <div className="bubble">Pensando…</div>
            </div>
          )}
        </div>

        <footer className="chat-compose">
          <div className="compose-box">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí acá…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button onClick={send} disabled={loading}>
              Enviar
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

