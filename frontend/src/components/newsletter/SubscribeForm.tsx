'use client';

import { useState } from "react";
import { subscribeToNewsletter } from "../../api/newsletter";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setMessage(null);
    try {
      const res = await subscribeToNewsletter(email.trim());
      setStatus("success");
      setMessage(res.detail);
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage((err as Error).message);
    }
  }

  return (
    <div
      style={{
        padding: "0.9rem 1rem",
        borderTop: "1px solid #1e1e2a",
        background: "#0d0d14",
      }}
    >
      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#55556a", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "0.6rem" }}>
        Subscribe
      </div>

      {status === "success" ? (
        <p style={{ fontSize: "0.78rem", color: "#52c8a0", margin: 0, lineHeight: 1.5 }}>
          {message ?? "Check your email to confirm."}
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading"}
            style={{
              background: "#13131c",
              border: "1px solid #2a2a3a",
              borderRadius: 4,
              color: "#e8e8f0",
              fontSize: "0.82rem",
              padding: "0.4rem 0.6rem",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            style={{
              background: "#e05252",
              border: "none",
              borderRadius: 4,
              color: "#fff",
              fontSize: "0.8rem",
              fontWeight: 600,
              padding: "0.45rem 0",
              cursor: status === "loading" ? "default" : "pointer",
              opacity: status === "loading" ? 0.6 : 1,
            }}
          >
            {status === "loading" ? "Subscribing…" : "Subscribe"}
          </button>
          {status === "error" && message && (
            <p style={{ fontSize: "0.73rem", color: "#e05252", margin: 0 }}>{message}</p>
          )}
        </form>
      )}
    </div>
  );
}
