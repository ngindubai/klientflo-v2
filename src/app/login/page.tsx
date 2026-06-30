import Link from "next/link";
import { prisma } from "@/lib/db";
import { usingDefaultPassword } from "@/server/auth";
import { LoginForm } from "@/components/auth/login-form";
import { APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Prefill the single agent's email (Phase 1 convenience).
  const [agent, hint] = await Promise.all([
    prisma.agent.findFirst({ orderBy: { createdAt: "asc" }, select: { email: true } }),
    usingDefaultPassword(),
  ]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground">
            K
          </span>
          <span className="text-xl font-semibold tracking-tight">{APP_NAME}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 mb-6 text-sm text-foreground-muted">
          Sign in to your AI real estate assistant.
        </p>
        <LoginForm defaultEmail={agent?.email ?? ""} hintPassword={hint} />

        <p className="mt-8 flex justify-center gap-4 text-xs text-foreground-muted">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms of Service
          </Link>
        </p>
      </div>
    </main>
  );
}
