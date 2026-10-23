import { supabase } from "./supabase";
import type { Category, TxType } from "./types";

const DEFAULTS: Record<TxType, Record<string, string[]>> = {
  expense: {
    식비: ["식료품", "외식", "카페/간식", "배달"],
    주거: ["월세/관리비", "공과금", "인터넷/통신"],
    교통: ["대중교통", "택시", "주유", "주차/통행료"],
    생활: ["생활용품", "의류/미용", "가전/가구"],
    "건강/의료": ["병원", "약국", "운동"],
    "문화/여가": ["취미", "여행", "구독서비스"],
    교육: ["도서", "강의/학원"],
    경조사: ["선물", "경조사비"],
    기타: ["기타"],
  },
  income: {
    급여: ["월급", "상여금"],
    부수입: ["사업소득", "이자/배당", "중고판매"],
    용돈: ["용돈"],
    기타: ["기타"],
  },
};

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase()
    .from("categories")
    .select("id,type,name,parent_id,sort_order")
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return data as Category[];
}

/** 카테고리가 하나도 없으면 기본 카테고리를 만들어 준다. */
export async function ensureDefaultCategories(): Promise<Category[]> {
  const existing = await fetchCategories();
  if (existing.length > 0) return existing;

  for (const type of ["expense", "income"] as TxType[]) {
    const mains = Object.keys(DEFAULTS[type]);
    const { data: parents, error } = await supabase()
      .from("categories")
      .insert(mains.map((name, i) => ({ type, name, sort_order: i })))
      .select("id,name");
    if (error) throw error;
    const subs = parents!.flatMap((p) =>
      DEFAULTS[type][p.name].map((name, i) => ({ type, name, parent_id: p.id, sort_order: i })),
    );
    const { error: subError } = await supabase().from("categories").insert(subs);
    if (subError) throw subError;
  }
  return fetchCategories();
}

export async function createCategory(
  type: TxType,
  name: string,
  parentId: string | null,
): Promise<Category> {
  const { data, error } = await supabase()
    .from("categories")
    .insert({ type, name, parent_id: parentId, sort_order: 999 })
    .select("id,type,name,parent_id,sort_order")
    .single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase().from("categories").delete().eq("id", id);
  if (error) throw error;
}

/** 대분류/소분류 이름으로 소분류 id 를 찾고, 없으면 만든다. (엑셀 업로드용) */
export async function findOrCreateSubCategory(
  categories: Category[],
  type: TxType,
  mainName: string,
  subName: string,
): Promise<string> {
  let main = categories.find((c) => c.type === type && !c.parent_id && c.name === mainName);
  if (!main) {
    main = await createCategory(type, mainName, null);
    categories.push(main);
  }
  const sub = subName || mainName;
  let child = categories.find((c) => c.parent_id === main!.id && c.name === sub);
  if (!child) {
    child = await createCategory(type, sub, main.id);
    categories.push(child);
  }
  return child.id;
}

export function categoryLabel(categories: Category[], id: string | null): string {
  if (!id) return "미분류";
  const c = categories.find((x) => x.id === id);
  if (!c) return "미분류";
  const parent = c.parent_id ? categories.find((x) => x.id === c.parent_id) : null;
  return parent ? `${parent.name} > ${c.name}` : c.name;
}
