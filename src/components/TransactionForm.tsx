"use client";

import { useMemo, useState } from "react";
import { createCategory } from "@/lib/categories";
import { toLocalInput } from "@/lib/format";
import {
  METHOD_LABEL,
  TYPE_LABEL,
  type Category,
  type NewTransaction,
  type PaymentMethod,
  type Transaction,
  type TxType,
} from "@/lib/types";

interface Props {
  categories: Category[];
  initial: Transaction | null;
  defaultDate: Date;
  onCategoryCreated: (c: Category) => void;
  onSave: (tx: NewTransaction, id?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export default function TransactionForm(props: Props) {
  const { categories, initial } = props;
  const initialSub = initial?.category_id ? categories.find((c) => c.id === initial.category_id) : undefined;

  const [type, setType] = useState<TxType>(initial?.type ?? "expense");
  const [when, setWhen] = useState(toLocalInput(initial ? new Date(initial.occurred_at) : props.defaultDate));
  const [mainId, setMainId] = useState(initialSub?.parent_id ?? "");
  const [subId, setSubId] = useState(initialSub?.id ?? "");
  const [method, setMethod] = useState<PaymentMethod>(initial?.payment_method ?? "card");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mains = useMemo(() => categories.filter((c) => c.type === type && !c.parent_id), [categories, type]);
  const subs = useMemo(() => categories.filter((c) => c.parent_id === mainId), [categories, mainId]);

  function changeType(t: TxType) {
    setType(t);
    setMainId("");
    setSubId("");
  }

  async function addCategory(parentId: string | null) {
    const name = window.prompt(parentId ? "새 소분류 이름" : "새 대분류 이름")?.trim();
    if (!name) return;
    try {
      const c = await createCategory(type, name, parentId);
      props.onCategoryCreated(c);
      if (parentId) setSubId(c.id);
      else {
        setMainId(c.id);
        setSubId("");
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(value) || value <= 0) return setError("금액을 올바르게 입력하세요.");
    if (!subId) return setError("카테고리(소분류)를 선택하세요.");
    setBusy(true);
    setError(null);
    try {
      await props.onSave(
        {
          type,
          occurred_at: new Date(when).toISOString(),
          category_id: subId,
          payment_method: method,
          amount: Math.round(value),
          memo: memo.trim() || null,
        },
        initial?.id,
      );
      props.onClose();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function remove() {
    if (!initial || !window.confirm("이 내역을 삭제할까요?")) return;
    setBusy(true);
    try {
      await props.onDelete(initial.id);
      props.onClose();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <form className="card w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2 className="text-lg font-bold">{initial ? "내역 수정" : "내역 추가"}</h2>

        <div className="segmented">
          {(["expense", "income"] as TxType[]).map((t) => (
            <button
              type="button"
              key={t}
              className={type === t ? (t === "expense" ? "on-expense" : "on-income") : ""}
              onClick={() => changeType(t)}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>

        <label className="field">
          <span>일시</span>
          <input type="datetime-local" required className="input" value={when} onChange={(e) => setWhen(e.target.value)} />
        </label>

        <div className="field">
          <span>카테고리</span>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex gap-1">
              <select
                className="input"
                value={mainId}
                onChange={(e) => {
                  setMainId(e.target.value);
                  setSubId("");
                }}
              >
                <option value="">대분류</option>
                {mains.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button type="button" className="btn-icon" title="대분류 추가" onClick={() => addCategory(null)}>
                +
              </button>
            </div>
            <div className="flex gap-1">
              <select className="input" value={subId} disabled={!mainId} onChange={(e) => setSubId(e.target.value)}>
                <option value="">소분류</option>
                {subs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-icon"
                title="소분류 추가"
                disabled={!mainId}
                onClick={() => addCategory(mainId)}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="field">
          <span>결제수단</span>
          <div className="segmented">
            {(["card", "cash"] as PaymentMethod[]).map((m) => (
              <button type="button" key={m} className={method === m ? "on" : ""} onClick={() => setMethod(m)}>
                {METHOD_LABEL[m]}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span>금액 (원)</span>
          <input
            inputMode="numeric"
            required
            className="input text-right"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d,]/g, ""))}
          />
        </label>

        <label className="field">
          <span>메모</span>
          <input className="input" value={memo} onChange={(e) => setMemo(e.target.value)} />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end">
          {initial && (
            <button type="button" className="btn-danger mr-auto" disabled={busy} onClick={remove}>
              삭제
            </button>
          )}
          <button type="button" className="btn" onClick={props.onClose}>
            취소
          </button>
          <button className="btn-primary" disabled={busy}>
            저장
          </button>
        </div>
      </form>
    </div>
  );
}
