"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function AuthForm({ next, initialMode, notice }: { next: string; initialMode: Mode; notice?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(notice ?? null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      router.replace(next);
      router.refresh();
      return;
    }

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    if (data.session) {
      router.replace(next);
      router.refresh();
      return;
    }
    // Email confirmation is on: no session until the link in the email is opened.
    setInfo("Almost there. Check your inbox and click the confirmation link, then sign in.");
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="auth-form">
      <div className="auth-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? "on" : ""} onClick={() => { setMode("signin"); setError(null); setInfo(null); }}>
          Sign in
        </button>
        <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "on" : ""} onClick={() => { setMode("signup"); setError(null); setInfo(null); }}>
          Create account
        </button>
      </div>

      <label className="field">
        <span className="label">Email</span>
        <input className="text-input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </label>
      <label className="field">
        <span className="label">Password</span>
        <input className="text-input" type="password" required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
      </label>

      {error && <p className="form-msg err" role="alert">{error}</p>}
      {info && <p className="form-msg ok" role="status">{info}</p>}

      <button className="btn-primary" disabled={busy}>
        {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
