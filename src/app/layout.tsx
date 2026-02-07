import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "マイプロンプト — プロンプト管理ツール",
  description: "AIプロンプトを保存・整理・共有できるツール",
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
        {children}
      </body>
    </html>
  );
}
