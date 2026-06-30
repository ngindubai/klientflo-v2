"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserPlus } from "lucide-react";
import { createTeamUser, deleteTeamUser } from "@/server/user-actions";

type TeamUser = {
  id: string;
  email: string;
  name: string | null;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

export function TeamSettings({ users }: { users: TeamUser[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    start(async () => {
      try {
        await createTeamUser(data);
        form.reset();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add user.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-foreground-muted">
        Per-user login accounts (passwords stored as scrypt hashes). The access
        gate is currently open, so login is optional — these are ready for when
        it&apos;s switched on.
      </p>

      {users.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{u.name ?? u.email}</p>
                {u.name && (
                  <p className="truncate text-xs text-foreground-muted">{u.email}</p>
                )}
              </div>
              <form action={deleteTeamUser.bind(null, u.id)}>
                <button
                  type="submit"
                  className="rounded-md border border-border p-1.5 text-foreground-muted hover:bg-surface-muted"
                  title="Remove user"
                >
                  <Trash2 className="size-4" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input name="name" placeholder="Name (optional)" className={inputClass} />
        <input
          name="email"
          type="email"
          required
          placeholder="email@agency.ae"
          className={inputClass}
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password (min 8)"
          className={inputClass}
        />
        {error && (
          <p className="rounded-lg bg-urgency-5/10 px-3 py-2 text-sm text-urgency-5 sm:col-span-3">
            {error}
          </p>
        )}
        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            <UserPlus className="size-4" /> {pending ? "Adding…" : "Add user"}
          </button>
        </div>
      </form>
    </div>
  );
}
