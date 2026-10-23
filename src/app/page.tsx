"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import AuthForm from "@/components/AuthForm";
import Ledger from "@/components/Ledger";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function Home() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const auth = supabase().auth;
    auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <main className="p-8 text-center text-sm text-gray-600">
        NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수를 설정하세요.
      </main>
    );
  }
  if (session === undefined) return <main className="p-8 text-center text-gray-500">불러오는 중…</main>;
  if (!session) return <AuthForm />;
  return <Ledger email={session.user.email ?? ""} />;
}
