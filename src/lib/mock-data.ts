export type Phase = "All" | "Planning" | "Design" | "Implementation" | "Debug" | "Release" | "Other";

export interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  phase: Exclude<Phase, "All">;
  visibility: "Private" | "Public";
  updatedAt: string;
  likeCount: number;
  useCount?: number;
  isPinned?: boolean;
  authorId?: string;
  authorName?: string;
  authorAvatarUrl?: string;
  lineage: {
    parent?: string;
    children?: string[];
    isOriginal: boolean;
  };
}

export const MOCK_PROMPTS: Prompt[] = [
  {
    id: "1",
    title: "Cursor用: Tailwindレイアウト修正",
    content: "以下の `{Component Code}` をスマホで見ても崩れないように修正して。特に `grid-cols-1` から `md:grid-cols-3` への変化をスムーズに。",
    tags: ["Cursor", "CSS", "Tailwind"],
    phase: "Implementation",
    visibility: "Private",
    updatedAt: "2026-02-07T10:00:00",
    likeCount: 3,
    authorId: "mock-user",
    lineage: {
      isOriginal: true,
    },
  },
  {
    id: "2",
    title: "PRD(要件定義)一撃作成マスター",
    content: "# 前提\nあなたは熟練のPMです。以下の `{Idea}` を元に、開発者向けのPRD（要件定義書）を作成してください。\n\n# 出力項目\n- ユーザーの課題\n- コア機能\n- ユーザーストーリー",
    tags: ["ChatGPT", "Planning", "PM"],
    phase: "Planning",
    visibility: "Public",
    updatedAt: "2026-02-06T15:30:00",
    likeCount: 12,
    authorId: "other-user",
    lineage: {
      parent: "Old PRD Gen",
      children: ["Fixed for SaaS", "Mobile App ver"],
      isOriginal: false,
    },
  },
  {
    id: "3",
    title: "バグ修正：エラーメッセージ解読",
    content: "以下のエラーメッセージ `{Error Message}` が出ました。\n\n初心者にもわかるように原因と修正方法を教えてください。\nコードの修正例も書いてください。",
    tags: ["Debug", "初心者向け"],
    phase: "Debug",
    visibility: "Public",
    updatedAt: "2026-02-05T09:00:00",
    likeCount: 7,
    authorId: "mock-user",
    lineage: {
      isOriginal: true,
    },
  },
];

export interface PhaseInfo {
  id: Phase;
  label: string;
  icon: string;
  hint: string;
}

export const PHASES: PhaseInfo[] = [
  { id: "All", label: "すべて", icon: "🏠", hint: "全フェーズのプロンプト" },
  { id: "Planning", label: "企画", icon: "🌱", hint: "アイデアを整理するとき" },
  { id: "Design", label: "設計", icon: "🎨", hint: "画面や構成を考えるとき" },
  { id: "Implementation", label: "実装", icon: "💻", hint: "コードを書くとき" },
  { id: "Debug", label: "デバッグ", icon: "🐛", hint: "エラーを直すとき" },
  { id: "Release", label: "リリース", icon: "🚀", hint: "公開するとき" },
  { id: "Other", label: "その他", icon: "📦", hint: "その他のプロンプト" },
];
