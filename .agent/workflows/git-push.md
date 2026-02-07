---
description: 変更をGitHub（komi0929/myprompt）にコミット＆プッシュする
---

# Git コミット＆プッシュ

変更があるたびにこのワークフローを実行し、GitHubに記録を残す。

## 手順

// turbo-all

1. ビルドが通ることを確認する

```bash
npm run build
```

2. 変更内容を確認する

```bash
git status
```

3. 変更差分を確認する

```bash
git diff --stat
```

4. すべての変更をステージングする

```bash
git add .
```

5. Conventional Commits 形式でコミットする

```bash
git commit -m "<type>: <変更の要約>"
```

- `feat:` 新機能追加
- `fix:` バグ修正
- `refactor:` リファクタリング
- `chore:` 設定・依存関係変更
- `docs:` ドキュメント変更
- `deploy:` デプロイ関連

6. GitHubにプッシュする

```bash
git push origin main
```
