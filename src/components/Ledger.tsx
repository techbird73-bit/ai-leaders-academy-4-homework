"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ensureDefaultCategories } from "@/lib/categories";
import { monthLabel, won } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { Category, NewTransaction, Transaction } from "@/lib/types";
import CalendarView from "./CalendarView";
import ListView from "./ListView";
import TransactionForm from "./TransactionForm";

const ExcelUpload = dynamic(() => import("./ExcelUpload"), { ssr: false });

type Tab = "calendar" | "list";

export default function Ledger({ email }: { email: string }) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => new Date());
  const [tab, setTab] = useState<Tab>("calendar");
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ tx: Transaction | null; date: Date } | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadCategories = useCallback(async () => {
    setCategories(await ensureDefaultCategories());
  }, []);

  const loadTransactions = useCallback(async () => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    const { data, error } = await supabase()
      .from("transactions")
      .select("id,type,occurred_at,category_id,payment_method,amount,memo")
      .gte("occurred_at", start.toISOString())
      .lt("occurred_at", end.toISOString())
      .order("occurred_at");
    if (error) throw error;
    setTransactions(data as Transaction[]);
  }, [month]);

  useEffect(() => {
    loadCategories().catch((e) => setError(e.message));
  }, [loadCategories]);

  useEffect(() => {
    setLoading(true);
    loadTransactions()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [loadTransactions]);

  const totals = useMemo(() => {
    const t = { income: 0, expense: 0 };
    for (const tx of transactions) t[tx.type] += tx.amount;
    return t;
  }, [transactions]);

  function moveMonth(delta: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    setMonth(next);
    setSelected(next);
  }

  function goToday() {
    const now = new Date();
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelected(now);
  }

  async function saveTx(tx: NewTransaction, id?: string) {
    const query = id
      ? supabase().from("transactions").update(tx).eq("id", id)
      : supabase().from("transactions").insert(tx);
    const { error } = await query;
    if (error) throw error;
    await loadTransactions();
  }

  async function deleteTx(id: string) {
    const { error } = await supabase().from("transactions").delete().eq("id", id);
    if (error) throw error;
    await loadTransactions();
  }

  function openNew(date: Date) {
    const now = new Date();
    const d = new Date(date);
    d.setHours(now.getHours(), now.getMinutes(), 0, 0);
    setEditing({ tx: null, date: d });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold mr-auto">💰 나의 가계부</h1>
        <span className="text-xs text-gray-500 hidden sm:inline">{email}</span>
        <button className="btn" onClick={() => supabase().auth.signOut()}>
          로그아웃
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <button className="btn-icon" onClick={() => moveMonth(-1)} aria-label="이전 달">
            ‹
          </button>
          <span className="font-semibold w-28 text-center">{monthLabel(month)}</span>
          <button className="btn-icon" onClick={() => moveMonth(1)} aria-label="다음 달">
            ›
          </button>
          <button className="btn text-xs ml-1" onClick={goToday}>
            오늘
          </button>
        </div>
        <div className="flex gap-2 ml-auto">
          <button className="btn" onClick={() => setUploading(true)}>
            엑셀 업로드
          </button>
          <button className="btn-primary" onClick={() => openNew(selected)}>
            + 내역 추가
          </button>
        </div>
      </div>

      <section className="grid grid-cols-3 gap-2">
        <div className="card p-3">
          <p className="text-xs text-gray-500">수입</p>
          <p className="font-bold text-blue-600">{won(totals.income)}원</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-500">지출</p>
          <p className="font-bold text-red-600">{won(totals.expense)}원</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-gray-500">합계</p>
          <p className="font-bold">{won(totals.income - totals.expense)}원</p>
        </div>
      </section>

      <nav className="tabs">
        <button className={tab === "calendar" ? "active" : ""} onClick={() => setTab("calendar")}>
          캘린더
        </button>
        <button className={tab === "list" ? "active" : ""} onClick={() => setTab("list")}>
          목록
        </button>
      </nav>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-gray-500">불러오는 중…</p>}

      {tab === "calendar" ? (
        <CalendarView
          month={month}
          transactions={transactions}
          categories={categories}
          selected={selected}
          onSelect={setSelected}
          onEdit={(tx) => setEditing({ tx, date: new Date(tx.occurred_at) })}
          onAdd={openNew}
        />
      ) : (
        <ListView
          transactions={transactions}
          categories={categories}
          onEdit={(tx) => setEditing({ tx, date: new Date(tx.occurred_at) })}
        />
      )}

      {editing && (
        <TransactionForm
          categories={categories}
          initial={editing.tx}
          defaultDate={editing.date}
          onCategoryCreated={(c) => setCategories((prev) => [...prev, c])}
          onSave={saveTx}
          onDelete={deleteTx}
          onClose={() => setEditing(null)}
        />
      )}

      {uploading && (
        <ExcelUpload
          categories={categories}
          onDone={() => {
            loadCategories();
            loadTransactions();
          }}
          onClose={() => setUploading(false)}
        />
      )}
    </div>
  );
}
