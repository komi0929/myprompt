---
description: プッシュ前の品質ゲート検証
---

# Pre-Push 品質ゲートワークフロー

**コードをプッシュする前に必ず実行する。**

## Steps

// turbo-all

1. 型チェック:

```powershell
npx tsc --noEmit
```

2. ビルドチェック:

```powershell
npm run build
```

3. 両方成功したら、コミット＆プッシュ:

```powershell
git add -A
git commit -m "feat: [変更内容]"
git push origin main
```

## よくあるエラーと対処法

| エラー                                             | 原因                   | 修正方法              |
| -------------------------------------------------- | ---------------------- | --------------------- |
| `Cannot find name 'X'`                             | import 漏れ            | import を追加         |
| `Type 'any' is not assignable to type 'never'`     | Supabase型未定義       | `as any` でキャスト   |
| `Object literal may only specify known properties` | インターフェース不一致 | 型定義を確認          |
| `Module not found`                                 | パス不正               | `@/` エイリアスを確認 |
