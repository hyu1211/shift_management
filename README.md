# 塾シフト管理システム

個別指導塾向けのシフト管理 Web アプリケーションです。講師のシフト提出から、授業への講師の**自動割り当て**（QUBO + シミュレーテッドアニーリング）、シフト確定までを一気通貫で管理します。

## 主な機能

### 講師向け
- シフト提出: 月を前半（1〜15日）/ 後半（16日〜月末）の期間単位で選び、出勤日と勤務時間帯を提出
- マイシフト確認: 確定した自分の担当授業を閲覧

### 管理者（教室長）向け
- 授業登録: 生徒・科目・時限を指定して授業コマを登録（科目・生徒はマスタからの選択式で表記ゆれを防止）
- シフト管理: 提出されたシフトの一覧・確定、および授業への講師の自動割り当てと保存
- 一斉振り分け: 期間内の全日程をまとめて自動割り当て
- 確定シフト閲覧: 月単位の確定済み割り当ての読み取り専用ビュー
- 生徒情報 / 講師情報の管理（検索・絞り込み付き）
- 未割当授業のアラート表示

## アーキテクチャ

```
┌──────────────────────┐         ┌──────────────────────────┐
│  Next.js (frontend/) │  HTTP   │  FastAPI (api/)          │
│  App Router          ├────────►│  最適化API                │
│  Server Actions      │ X-Api-Key│  QUBO + SA (pyqubo/neal) │
└──────────┬───────────┘         └──────────────────────────┘
           │ @supabase/ssr
           ▼
┌──────────────────────┐
│  Supabase            │
│  Auth + Postgres     │
│  (RLS で行レベル制御) │
└──────────────────────┘
```

- **フロントエンド**: Next.js（App Router）。データ更新は Server Actions 経由で行い、管理者権限チェック（`assertAdmin`）をサーバー側で実施
- **DB / 認証**: Supabase。全テーブルで RLS（Row Level Security）を有効化し、「講師は自分の行のみ・管理者は全件」を DB レイヤーで強制。role の自己昇格も RLS で禁止
- **最適化 API**: FastAPI。シフト割り当てを QUBO（二次制約なし二値最適化）として定式化し、シミュレーテッドアニーリング（dwave-neal）で解く。`X-Api-Key` ヘッダーによる認証付き

### 自動割り当てのロジック（`api/main.py`）

授業 × 講師の割り当てを 0/1 変数の行列として QUBO を構築します。

| 制約 | 種別 |
|---|---|
| 各授業にちょうど1人を割り当てる | ハード制約 |
| 同一講師は同じ時限の授業を掛け持ちできない | ハード制約 |
| 担当科目が一致しない講師には割り当てない | ハード制約 |
| 講師の勤務時間帯外の授業には割り当てない | ハード制約 |
| どうしても埋まらない枠は「ダミー講師」が吸収 | ソフト制約（ペナルティ） |

ハード制約を破る解は棄却し（`infeasible`）、ダミー講師に落ちた授業は「未配置」として画面上でアラート表示されます。

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | Next.js / React / TypeScript / Tailwind CSS |
| バックエンド (BaaS) | Supabase (Auth, Postgres, RLS) |
| 最適化 API | Python / FastAPI / pyqubo / dwave-neal |
| テスト | pytest（API）/ Vitest（フロント） |

## ディレクトリ構成

```
.
├── api/                  # FastAPI 最適化API
│   ├── main.py           # QUBO構築・SA実行・エンドポイント
│   └── tests/            # pytest テスト
└── frontend/             # Next.js アプリ
    ├── src/
    │   ├── app/          # ルーティング（(admin) / (teacher) / (public)）
    │   ├── features/     # 機能単位のコンポーネント・Server Actions・純粋ロジック
    │   ├── components/   # 共通UI
    │   └── lib/          # Supabase クライアント・認証ヘルパー
    └── supabase/         # テーブル定義・RLSポリシーのSQL
```

## セットアップ

### 前提

- Node.js 20+
- Python 3.12+
- Supabase プロジェクト（無料枠で可）

### 1. Supabase の準備

Supabase Dashboard の SQL Editor で `frontend/supabase/` 配下の SQL を実行し、テーブルと RLS ポリシーを作成します。

- `profiles.sql` / `shifts.sql` / `lessons.sql` / `students.sql`

### 2. 最適化 API（api/）

```bash
cd api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

export OPTIMIZE_API_KEY=<任意のシークレット>   # フロント側と同じ値にする
# 本番では ALLOWED_ORIGINS=https://<フロントのURL> を設定（カンマ区切りで複数可）
uvicorn main:app --reload   # http://127.0.0.1:8000
```

### 3. フロントエンド（frontend/）

`frontend/.env.local` を作成:

```bash
NEXT_PUBLIC_SUPABASE_URL=<SupabaseプロジェクトURL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase anonキー>
OPTIMIZE_API_URL=http://127.0.0.1:8000/api/optimize
OPTIMIZE_API_KEY=<APIと同じシークレット>
```

```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

## テスト

```bash
# 最適化API（QUBO制約・デコード・認証・エンドポイントのテスト）
cd api
pip install -r requirements-dev.txt
python -m pytest

# フロントエンド（日付・時限・科目まわりの純粋ロジックのテスト）
cd frontend
npm test
```

## セキュリティ設計

- **RLS を第一の防御線に**: 画面側の出し分けに頼らず、Postgres の RLS ポリシーで「誰がどの行を読み書きできるか」を強制。一般ユーザーによる role の自己昇格や、未ログイン（anon）でのデータ閲覧を DB レイヤーで遮断
- **Server Actions での権限チェック**: 管理者専用の操作はサーバー側で `assertAdmin` を通す
- **最適化 API の保護**: `X-Api-Key` による認証と CORS のオリジン制限。API キーはサーバー側環境変数のみに保持し、クライアントには渡さない
