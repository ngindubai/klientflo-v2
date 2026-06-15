"use client";

import { useState, useTransition } from "react";
import { login } from "@/server/auth";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export function LoginForm({
  defaultEmail,
  hintPassword,
}: {
  defaultEmail: string;
  hintPassword: boolean;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await login(email, password);
      } catch (err) {
        if (
          err &&
          typeof err === "object" &&
          "digest" in err &&
          String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
        ) {
          throw err;
        }
        setError(err instanceof Error ? err.message : "Login failed.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-foreground-muted">Email</label>
        <input
          type="email"
          required
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-foreground-muted">Password</label>
        <input
          type="password"
          required
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {hintPassword && (
          <p className="mt-1 text-xs text-foreground-muted">
            Demo password: <code className="font-mono">klientflo</code> (set
            APP_PASSWORD to change)
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-urgency-5/10 px-3 py-2 text-sm text-urgency-5">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
