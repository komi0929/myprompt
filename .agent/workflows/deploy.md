---
description: Vercelプロダクションデプロイ
---

# プロダクションデプロイワークフロー

## Steps

// turbo-all

1. 品質チェック:

```powershell
npx tsc --noEmit
npm run build
```

2. コミット＆プッシュ:

```powershell
git add -A
git commit -m "deploy: production release"
git push origin main
```

3. Vercelデプロイ（CI/CD連携済みの場合は自動）:

```powershell
npx -y vercel --prod --yes
```

## ロールバック

デプロイに失敗した場合:

```powershell
npx -y vercel rollback
```

## 強制再デプロイ（キャッシュクリア）

コードは正しいがプロダクションに反映されない場合:

```powershell
npx -y vercel deploy --prod --force
```

## 空コミットトリガー

環境変数変更後など、コード変更なしで再ビルドが必要な場合:

```powershell
git commit --allow-empty -m "chore: trigger deploy"
git push origin main
```
