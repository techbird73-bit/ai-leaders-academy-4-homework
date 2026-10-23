"use client";

import { useMemo, useState } from "react";
import { categoryLabel } from "@/lib/categories";
import { timeLabel, won } from "@/lib/format";
import { METHOD_LABEL, TYPE_LABEL, type Category, type PaymentMethod, type Transaction, type TxType } from "@/lib/types";

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (tx: Transaction) => void;
}

export default function ListView({ transactions, categories, onEdit }: Props) {
  const [type, setType] = useState<TxType | "all">("all");
  const [method, setMethod] = useState<PaymentMethod | "all">("all");

  const rows = useMemo(
    () =>
      transactions
        .filter((t) => (type === "all" || t.type === type) && (method === "all" || t.payment_method === method))
        .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)),
    [transactions, type, method],
  );

  return (
    <div className="card">
      <div className="flex flex-wrap gap-2 p-3 border-b">
        <select className="input w-auto" value={type} onChange={(e) => setType(e.target.value as TxType | "all")}>
          <option value="all">전체 구분</option>
          <option value="expense">지출</option>
          <option value="income">수입</option>
        </select>
        <select
          className="input w-auto"
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod | "all")}
        >
          <option value="all">전체 결제수단</option>
          <option value="card">카드</option>
          <option value="cash">현금</option>
        </select>
        <span className="ml-auto self-center text-sm text-gray-500">{rows.length}건</span>
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>일시</th>
              <th>구분</th>
              <th>카테고리</th>
              <th>결제수단</th>
              <th className="text-right">금액</th>
              <th>메모</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((tx) => {
              const d = new Date(tx.occurred_at);
              return (
                <tr key={tx.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onEdit(tx)}>
                  <td className="whitespace-nowrap">
                    {d.getMonth() + 1}/{d.getDate()} {timeLabel(d)}
                  </td>
                  <td className={tx.type === "expense" ? "text-red-600" : "text-blue-600"}>{TYPE_LABEL[tx.type]}</td>
                  <td className="whitespace-nowrap">{categoryLabel(categories, tx.category_id)}</td>
                  <td>{METHOD_LABEL[tx.payment_method]}</td>
                  <td className={`text-right font-semibold ${tx.type === "expense" ? "text-red-600" : "text-blue-600"}`}>
                    {won(tx.amount)}
                  </td>
                  <td className="text-gray-500">{tx.memo}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-8">
                  내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
