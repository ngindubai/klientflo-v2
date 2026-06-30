import Link from "next/link";
import { prisma } from "@/lib/db";
import { usingDefaultPassword } from "@/server/auth";
import { LoginForm } from "@/components/auth/login-form";
import { BrandLogo } from "@/components/brand-logo";
import { APP_TAGLINE } from "@/lib/constants";

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
        <div className="mb-8">
          <BrandLogo size="lg" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 mb-6 text-sm text-foreground-muted">
          Sign in to manage your WhatsApp leads and listings. {APP_TAGLINE}
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
