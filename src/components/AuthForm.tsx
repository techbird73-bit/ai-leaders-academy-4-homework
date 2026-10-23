"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

function authErrorMessage(message: string): string {
  if (/email not confirmed/i.test(message))
    return "이메일 인증이 안 된 계정입니다. Supabase > Authentication > Users 에서 이 계정을 Confirm 하거나 삭제 후 다시 가입하세요.";
  if (/invalid login credentials/i.test(message)) return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (/already registered/i.test(message)) return "이미 가입된 이메일입니다. 로그인하세요.";
  return message;
}

export default function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const auth = supabase().auth;
    let error = null;
    if (mode === "signup") {
      const res = await auth.signUp({ email, password });
      error = res.error;
      // 세션이 없으면(이미 가입된 이메일 등) 바로 로그인을 시도한다.
      if (!error && !res.data.session) error = (await auth.signInWithPassword({ email, password })).error;
    } else {
      error = (await auth.signInWithPassword({ email, password })).error;
    }
    setBusy(false);
    if (error) setMessage(authErrorMessage(error.message));
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm p-6 space-y-4">
        <h1 className="text-xl font-bold text-center">💰 나의 가계부</h1>
        <input
          type="email"
          required
          placeholder="이메일"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="비밀번호 (6자 이상)"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "처리 중…" : mode === "signin" ? "로그인" : "회원가입"}
        </button>
        {message && <p className="text-sm text-center text-gray-600">{message}</p>}
        <button
          type="button"
          className="text-sm text-blue-600 w-full"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "계정이 없나요? 회원가입" : "이미 계정이 있나요? 로그인"}
        </button>
      </form>
    </div>
  );
}
