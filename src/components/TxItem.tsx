import { categoryLabel } from "@/lib/categories";
import { timeLabel, won } from "@/lib/format";
import { METHOD_LABEL, type Category, type Transaction } from "@/lib/types";

/** 캘린더 하단 일별 목록에서 쓰는 한 줄 */
export default function TxItem({
  tx,
  categories,
  onClick,
}: {
  tx: Transaction;
  categories: Category[];
  onClick: () => void;
}) {
  const d = new Date(tx.occurred_at);
  return (
    <li>
      <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left">
        <span className="text-xs text-gray-500 w-10">{timeLabel(d)}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm truncate">{categoryLabel(categories, tx.category_id)}</span>
          <span className="block text-xs text-gray-500 truncate">
            {METHOD_LABEL[tx.payment_method]}
            {tx.memo && ` · ${tx.memo}`}
          </span>
        </span>
        <span className={`text-sm font-semibold ${tx.type === "expense" ? "text-red-600" : "text-blue-600"}`}>
          {tx.type === "expense" ? "-" : "+"}
          {won(tx.amount)}
        </span>
      </button>
    </li>
  );
}
