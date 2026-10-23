export type TxType = "expense" | "income";
export type PaymentMethod = "card" | "cash";

export interface Category {
  id: string;
  type: TxType;
  name: string;
  parent_id: string | null;
  sort_order: number;
}

export interface Transaction {
  id: string;
  type: TxType;
  occurred_at: string;
  category_id: string | null;
  payment_method: PaymentMethod;
  amount: number;
  memo: string | null;
}

export type NewTransaction = Omit<Transaction, "id">;

export const TYPE_LABEL: Record<TxType, string> = { expense: "지출", income: "수입" };
export const METHOD_LABEL: Record<PaymentMethod, string> = { card: "카드", cash: "현금" };
