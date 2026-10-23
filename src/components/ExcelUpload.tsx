"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { findOrCreateSubCategory } from "@/lib/categories";
import { won } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { METHOD_LABEL, TYPE_LABEL, type Category, type PaymentMethod, type TxType } from "@/lib/types";

const HEADERS = ["구분", "일시", "대분류", "소분류", "결제수단", "금액", "메모"] as const;

interface ParsedRow {
  row: number;
  type?: TxType;
  date?: Date;
  main: string;
  sub: string;
  method?: PaymentMethod;
  amount?: number;
  memo: string;
  error?: string;
}

interface Props {
  categories: Category[];
  onDone: () => void;
  onClose: () => void;
}

export function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    [...HEADERS],
    ["지출", "2026-10-01 12:30", "식비", "외식", "카드", 12000, "점심"],
    ["수입", "2026-10-25 09:00", "급여", "월급", "현금", 3000000, ""],
  ]);
  ws["!cols"] = [{ wch: 6 }, { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 20 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "가계부");
  XLSX.writeFile(wb, "가계부_업로드양식.xlsx");
}

function parseDate(v: unknown): Date | undefined {
  if (typeof v === "number") {
    const p = XLSX.SSF.parse_date_code(v);
    if (!p) return undefined;
    return new Date(p.y, p.m - 1, p.d, p.H, p.M, Math.floor(p.S));
  }
  if (typeof v === "string") {
    const m = v.trim().match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})\.?(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (!m) return undefined;
    return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
  }
  return undefined;
}

function parseRows(rows: Record<string, unknown>[]): ParsedRow[] {
  return rows.map((r, i) => {
    const str = (k: string) => String(r[k] ?? "").trim();
    const typeText = str("구분");
    const methodText = str("결제수단");
    const amountRaw = r["금액"];
    const amount = typeof amountRaw === "number" ? amountRaw : Number(String(amountRaw ?? "").replace(/[^\d.-]/g, ""));
    const parsed: ParsedRow = {
      row: i + 2,
      type: typeText === "지출" ? "expense" : typeText === "수입" ? "income" : undefined,
      date: parseDate(r["일시"]),
      main: str("대분류"),
      sub: str("소분류"),
      method: methodText === "카드" ? "card" : methodText === "현금" ? "cash" : undefined,
      amount: Number.isFinite(amount) && amount > 0 ? Math.round(amount) : undefined,
      memo: str("메모"),
    };
    const errors = [];
    if (!parsed.type) errors.push("구분(지출/수입)");
    if (!parsed.date) errors.push("일시");
    if (!parsed.main) errors.push("대분류");
    if (!parsed.method) errors.push("결제수단(카드/현금)");
    if (!parsed.amount) errors.push("금액");
    if (errors.length) parsed.error = `${errors.join(", ")} 확인 필요`;
    return parsed;
  });
}

export default function ExcelUpload({ categories, onDone, onClose }: Props) {
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    setError(null);
    try {
      const wb = XLSX.read(await file.arrayBuffer());
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      if (json.length === 0) return setError("데이터가 없습니다.");
      const missing = HEADERS.filter((h) => h !== "메모" && h !== "소분류" && !(h in json[0]));
      if (missing.length) return setError(`필수 열이 없습니다: ${missing.join(", ")}`);
      setRows(parseRows(json));
    } catch (e) {
      setError(`파일을 읽을 수 없습니다: ${(e as Error).message}`);
    }
  }

  const valid = rows?.filter((r) => !r.error) ?? [];
  const invalidCount = (rows?.length ?? 0) - valid.length;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const cats = [...categories];
      const records = [];
      for (const r of valid) {
        records.push({
          type: r.type!,
          occurred_at: r.date!.toISOString(),
          category_id: await findOrCreateSubCategory(cats, r.type!, r.main, r.sub),
          payment_method: r.method!,
          amount: r.amount!,
          memo: r.memo || null,
        });
      }
      for (let i = 0; i < records.length; i += 500) {
        const { error } = await supabase().from("transactions").insert(records.slice(i, i + 500));
        if (error) throw error;
      }
      window.alert(`${records.length}건을 저장했습니다.`);
      onDone();
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card w-full max-w-3xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">엑셀 업로드</h2>
          <button className="btn" onClick={downloadTemplate}>
            양식 다운로드
          </button>
        </div>
        <p className="text-sm text-gray-600">
          첫 행에 <b>{HEADERS.join(", ")}</b> 열이 있어야 합니다. 구분은 지출/수입, 결제수단은 카드/현금으로
          적어주세요. 없는 카테고리는 자동으로 만들어집니다.
        </p>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          className="block w-full text-sm"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />

        {rows && (
          <>
            <p className="text-sm">
              전체 {rows.length}건 · 저장 가능 <b className="text-blue-600">{valid.length}</b>건
              {invalidCount > 0 && (
                <>
                  {" "}
                  · 오류 <b className="text-red-600">{invalidCount}</b>건 (제외됨)
                </>
              )}
            </p>
            <div className="max-h-80 overflow-auto border rounded">
              <table className="table">
                <thead>
                  <tr>
                    <th>행</th>
                    <th>구분</th>
                    <th>일시</th>
                    <th>카테고리</th>
                    <th>결제</th>
                    <th className="text-right">금액</th>
                    <th>메모 / 오류</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.row} className={r.error ? "bg-red-50" : ""}>
                      <td>{r.row}</td>
                      <td>{r.type ? TYPE_LABEL[r.type] : "-"}</td>
                      <td>{r.date ? r.date.toLocaleString("ko-KR") : "-"}</td>
                      <td>
                        {r.main}
                        {r.sub && ` > ${r.sub}`}
                      </td>
                      <td>{r.method ? METHOD_LABEL[r.method] : "-"}</td>
                      <td className="text-right">{r.amount ? won(r.amount) : "-"}</td>
                      <td className={r.error ? "text-red-600" : ""}>{r.error ?? r.memo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button className="btn" onClick={onClose}>
            닫기
          </button>
          <button className="btn-primary" disabled={busy || valid.length === 0} onClick={save}>
            {busy ? "저장 중…" : `${valid.length}건 저장`}
          </button>
        </div>
      </div>
    </div>
  );
}
