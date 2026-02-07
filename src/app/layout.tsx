import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AbortErrorSuppressor from "@/components/AbortErrorSuppressor";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "マイプロンプト — バイブコーダーのためのプロンプト簡単メモサイト",
  description: "バイブコーダーのためのプロンプト簡単メモサイト。AIプロンプトを保存・整理・共有できるツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-700`}
      >
        <AbortErrorSuppressor />
        {children}
      </body>
    </html>
  );
}

