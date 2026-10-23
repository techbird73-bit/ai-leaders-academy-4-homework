# 나의 가계부

Next.js + Supabase 로 만든 개인 가계부입니다. Vercel 에 배포합니다.

## 기능

- 지출/수입 직접 입력 (구분, 일시, 카테고리 2단계, 카드/현금, 금액, 메모)
- 엑셀(.xlsx/.xls/.csv) 업로드 — 화면에서 양식 다운로드 가능, 없는 카테고리는 자동 생성
- 캘린더 보기(기본) / 목록 보기 탭
- 이메일 로그인, 본인 데이터만 접근 (Supabase RLS)

## 엑셀 업로드 양식

| 구분 | 일시 | 대분류 | 소분류 | 결제수단 | 금액 | 메모 |
|---|---|---|---|---|---|---|
| 지출 | 2026-10-01 12:30 | 식비 | 외식 | 카드 | 12000 | 점심 |

- 구분: `지출` / `수입`, 결제수단: `카드` / `현금`
- 일시: 엑셀 날짜 서식 또는 `YYYY-MM-DD HH:mm` (`.` `/` 구분자도 가능)
- 소분류·메모는 비워도 됩니다 (소분류가 비면 대분류 이름으로 생성)

## 설정

### 1. Supabase

1. https://supabase.com 에서 새 프로젝트 생성
2. **SQL Editor** 에서 [`supabase/schema.sql`](supabase/schema.sql) 전체를 붙여넣고 Run
3. **Project Settings → API** 에서 `Project URL`, `anon public` 키 복사
4. (선택) **Authentication → Sign In / Providers → Email** 에서 `Confirm email` 을 끄면 가입 즉시 로그인됩니다.
   켜둘 경우 **Authentication → URL Configuration** 의 Site URL 을 Vercel 주소로 바꿔주세요.

### 2. 로컬 실행

```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev
```

### 3. Vercel

1. Vercel 에서 이 GitHub 레포지토리를 Import
2. Root Directory 가 레포 루트가 아니라면 해당 폴더로 지정
3. Environment Variables 에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가 후 Deploy
