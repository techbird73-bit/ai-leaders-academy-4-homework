import { createClient, SupabaseClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

// "https://xxx.supabase.co/rest/v1/" 처럼 경로가 붙어 있어도 origin 만 사용한다.
function normalizeUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}

const url = normalizeUrl(rawUrl);

export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!client) {
    if (!url || !anonKey) throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
    client = createClient(url, anonKey);
  }
  return client;
}
