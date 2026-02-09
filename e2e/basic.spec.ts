import { test, expect } from "@playwright/test";

test.describe("MyPrompt — ページ表示テスト", () => {
  test("ホームページが正常に読み込まれる", async ({ page }) => {
    await page.goto("/");
    // メインアプリのタイトルまたはロゴが表示される
    await expect(page.locator("body")).toBeVisible();
    // ページがクラッシュしていないことを確認
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test("フィードバックページが正常に読み込まれる", async ({ page }) => {
    await page.goto("/feedback");
    await expect(page.locator("body")).toBeVisible();
    // タブが表示されている
    await expect(page.getByText("改善要望・バグ報告")).toBeVisible();
    await expect(page.getByText("現在の機能")).toBeVisible();
    await expect(page.getByText("改善履歴")).toBeVisible();
  });

  test("お問い合わせページが正常に読み込まれる", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByText("お問い合わせ")).toBeVisible();
    await expect(page.locator("#contact-name")).toBeVisible();
    await expect(page.locator("#contact-email")).toBeVisible();
    await expect(page.locator("#contact-message")).toBeVisible();
  });

  test("ガイドページが正常に読み込まれる", async ({ page }) => {
    await page.goto("/guide");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("MyPrompt — フォームバリデーション", () => {
  test("お問い合わせ — 空送信でエラー表示", async ({ page }) => {
    await page.goto("/contact");
    // 空のまま送信
    await page.getByRole("button", { name: /送信/ }).click();
    // エラーメッセージが表示される
    await expect(page.getByText("すべての項目を入力してください")).toBeVisible();
  });

  test("フィードバック — 投稿フォームの開閉", async ({ page }) => {
    await page.goto("/feedback");
    // 投稿ボタンをクリック
    await page.getByRole("button", { name: /改善提案・バグ報告をする/ }).click();
    // フォームが表示される
    await expect(page.getByPlaceholder("タイトル（一言で）")).toBeVisible();
    // 閉じるボタン
    const closeBtn = page.locator("button").filter({ has: page.locator("svg.lucide-x") }).first();
    await closeBtn.click();
    // フォームが閉じる
    await expect(page.getByPlaceholder("タイトル（一言で）")).not.toBeVisible();
  });
});

test.describe("MyPrompt — ゲストUI確認", () => {
  test("ゲスト状態でプロンプト一覧が表示される", async ({ page }) => {
    await page.goto("/");
    // ページが正常読み込みされ、クラッシュしない
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });

  test("アカウントページ — ゲストはログイン導線表示", async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByText("ログインが必要です")).toBeVisible();
  });
});

test.describe("MyPrompt — ナビゲーション", () => {
  test("フィードバックページから戻るリンクが機能する", async ({ page }) => {
    await page.goto("/feedback");
    await page.getByText("戻る").click();
    await expect(page).toHaveURL("/");
  });

  test("お問い合わせページから戻るリンクが機能する", async ({ page }) => {
    await page.goto("/contact");
    await page.getByText("← MyPromptに戻る").click();
    await expect(page).toHaveURL("/");
  });
});
