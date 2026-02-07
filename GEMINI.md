# プロジェクト開発ルール

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **データベース**: Supabase (PostgreSQL + Auth + Storage)
- **スタイリング**: Tailwind CSS
- **言語**: TypeScript (strict mode)
- **デプロイ**: Vercel (Git Push自動デプロイ)

## コーディング規約

### TypeScript

- `any` 型の使用禁止（`unknown` + 型ガードを使用）
- 全ての関数に戻り値の型を明示
- `interface` を優先（`type` はユニオン型にのみ使用）

### React / Next.js

- Server Components をデフォルトとし、`'use client'` は必要な場合のみ
- `@/` パスエイリアスを常に使用
- コンポーネントは `export default function` で定義
- ファイル名: コンポーネントは PascalCase, ユーティリティは kebab-case

### Tailwind CSS

- インラインスタイル禁止（Tailwindクラスを使用）
- `cn()` ユーティリティで条件付きクラスを結合
- レスポンシブ: モバイルファーストアプローチ

### Supabase

- RLS (Row Level Security) を全テーブルで有効化
- `database.types.ts` を自動生成して型安全を確保
- Service Role Key はサーバーサイドのみで使用

## 品質基準

### ビルド前チェック（必須）

1. `npx tsc --noEmit` — 型エラーゼロ
2. `npm run build` — ビルド成功

### Git ルール

- コミットメッセージは Conventional Commits に従う
  - `feat:` / `fix:` / `chore:` / `refactor:` / `docs:` / `deploy:`
- ビルド失敗コードはプッシュしない（No Build, No Push）

## UI/UX 基準

- 日本語UI優先
- モバイルファースト設計
- アクセシビリティ: セマンティックHTML + 適切なaria属性
- パフォーマンス: Core Web Vitals を意識した最適化

## セキュリティ

- 環境変数は `.env.local` に保管、`NEXT_PUBLIC_` プレフィックスはクライアント公開可能なもののみ
- ユーザー入力は必ずバリデーション（zod推奨）
- API ルートに Rate Limiting を検討
