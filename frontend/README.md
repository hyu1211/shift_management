# frontend — 塾シフト管理システム

Next.js（App Router）製のフロントエンド。プロジェクト全体の概要・アーキテクチャ・Supabase のセットアップ手順は[ルートの README](../README.md) を参照してください。

## 開発コマンド

```bash
npm install
npm run dev     # 開発サーバー (http://localhost:3000)
npm run build   # 本番ビルド
npm test        # Vitest（純粋ロジックのユニットテスト）
npm run lint    # ESLint
```

## 必要な環境変数（.env.local）

```bash
NEXT_PUBLIC_SUPABASE_URL=<SupabaseプロジェクトURL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase anonキー>
OPTIMIZE_API_URL=http://127.0.0.1:8000/api/optimize
OPTIMIZE_API_KEY=<最適化APIと同じシークレット>
```

## ディレクトリ構成

```
src/
├── app/            # ルーティング
│   ├── (public)/   # ログイン・プロフィール設定・パスワードリセット
│   ├── (teacher)/  # 講師: シフト提出・マイシフト
│   └── (admin)/    # 管理者: 授業登録・シフト管理・確定シフト・生徒/講師情報
├── features/       # 機能単位の実装
│   └── <feature>/
│       ├── components/  # UI コンポーネント
│       ├── api/         # Server Actions
│       └── lib/         # 純粋ロジック（*.test.ts でテスト済み）
├── components/     # 共通UI（Button, Toast, DashboardShell など）
├── lib/            # Supabase クライアント・認証ヘルパー
└── types/          # 型定義
supabase/           # テーブル定義・RLSポリシーのSQL
```
