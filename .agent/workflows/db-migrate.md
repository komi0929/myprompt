---
description: Supabaseデータベースマイグレーション
---

# データベースマイグレーションワークフロー

## 新規マイグレーション作成

// turbo-all

1. マイグレーションファイル作成:

```powershell
npx supabase migration new <migration_name>
```

2. ローカルに適用:

```powershell
npx supabase db reset
```

## プロダクションに適用

1. リモートプロジェクトにリンク:

```powershell
npx supabase link --project-ref <project-ref>
```

2. マイグレーションをプッシュ:

```powershell
npx supabase db push
```

## 型の再生成

```powershell
npx supabase gen types typescript --local > src/lib/database.types.ts
```
