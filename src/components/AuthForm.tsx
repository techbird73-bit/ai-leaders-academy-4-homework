"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

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
    const { data, error } =
      mode === "signin"
        ? await auth.signInWithPassword({ email, password })
        : await auth.signUp({ email, password });
    setBusy(false);
    if (error) setMessage(error.message);
    else if (mode === "signup" && !data.session)
      setMessage("가입 확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인하세요.");
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
