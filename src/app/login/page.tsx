import { Suspense } from "react";
import Link from "next/link";
import { AuthForm } from "./AuthForm";

export const metadata = { title: "Sign in · MarketCap" };

async function LoginContent({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string; error?: string }> }) {
  const { next, mode, error } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden>
            <svg width="22" height="24" viewBox="0 0 20 22"><path d="M12.5 1 2 12.5h6.2L6.5 21 18 8.5h-6.4L12.5 1Z" fill="currentColor" /></svg>
          </span>
          MarketCap
        </div>
        <AuthForm next={safeNext} initialMode={mode === "signup" ? "signup" : "signin"} notice={error === "confirm_failed" ? "That confirmation link is invalid or has expired. Try signing in, or sign up again." : undefined} />
        <p className="auth-foot">
          <Link href="/pricing">See pricing</Link>
        </p>
      </div>
    </main>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string; error?: string }> }) {
  return (
    <Suspense fallback={<div className="page-loading" aria-busy="true">Loading…</div>}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
