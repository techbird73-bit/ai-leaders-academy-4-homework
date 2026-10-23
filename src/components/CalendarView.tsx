"use client";

import { useMemo } from "react";
import { dateKey, won } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";
import TxItem from "./TxItem";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface Props {
  month: Date;
  transactions: Transaction[];
  categories: Category[];
  selected: Date;
  onSelect: (d: Date) => void;
  onEdit: (tx: Transaction) => void;
  onAdd: (d: Date) => void;
}

export default function CalendarView({ month, transactions, categories, selected, onSelect, onEdit, onAdd }: Props) {
  const byDay = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; items: Transaction[] }>();
    for (const tx of transactions) {
      const key = dateKey(new Date(tx.occurred_at));
      const day = map.get(key) ?? { income: 0, expense: 0, items: [] };
      day[tx.type] += tx.amount;
      day.items.push(tx);
      map.set(key, day);
    }
    return map;
  }, [transactions]);

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const weeks = Math.ceil((first.getDay() + last.getDate()) / 7);
    return Array.from({ length: weeks * 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [month]);

  const todayKey = dateKey(new Date());
  const selectedKey = dateKey(selected);
  const selectedDay = byDay.get(selectedKey);

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 text-center text-xs font-medium border-b bg-gray-50">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={`py-2 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : ""}`}>
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d) => {
            const key = dateKey(d);
            const day = byDay.get(key);
            const inMonth = d.getMonth() === month.getMonth();
            return (
              <button
                key={key}
                onClick={() => onSelect(d)}
                onDoubleClick={() => onAdd(d)}
                className={`min-h-20 sm:min-h-24 border-b border-r p-1 text-left align-top flex flex-col gap-0.5 hover:bg-gray-50
                  ${inMonth ? "" : "opacity-35"} ${key === selectedKey ? "bg-blue-50 hover:bg-blue-50" : ""}`}
              >
                <span
                  className={`text-xs w-6 h-6 flex items-center justify-center rounded-full
                    ${key === todayKey ? "bg-gray-900 text-white" : d.getDay() === 0 ? "text-red-500" : d.getDay() === 6 ? "text-blue-500" : ""}`}
                >
                  {d.getDate()}
                </span>
                {day && day.income > 0 && (
                  <span className="text-[10px] sm:text-xs text-blue-600 truncate">+{won(day.income)}</span>
                )}
                {day && day.expense > 0 && (
                  <span className="text-[10px] sm:text-xs text-red-600 truncate">-{won(day.expense)}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <h3 className="font-semibold text-sm">
            {selected.getMonth() + 1}월 {selected.getDate()}일 ({WEEKDAYS[selected.getDay()]})
          </h3>
          <button className="btn text-xs" onClick={() => onAdd(selected)}>
            + 이 날짜에 추가
          </button>
        </div>
        {selectedDay ? (
          <ul className="divide-y">
            {[...selectedDay.items]
              .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at))
              .map((tx) => (
                <TxItem key={tx.id} tx={tx} categories={categories} onClick={() => onEdit(tx)} />
              ))}
          </ul>
        ) : (
          <p className="p-6 text-center text-sm text-gray-500">내역이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
