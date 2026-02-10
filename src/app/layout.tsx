import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AbortErrorSuppressor from "@/components/AbortErrorSuppressor";
import { ClientProviders } from "@/components/ClientProviders";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: "マイプロンプト — バイブコーダーのためのプロンプト簡単メモサイト",
  description: "バイブコーダーのためのプロンプト簡単メモサイト。AIプロンプトを保存・整理・共有できるツール",
  metadataBase: new URL("https://myprompt-one.vercel.app"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "マイプロンプト — バイブコーダーのためのプロンプト簡単メモサイト",
    description: "AIプロンプトを保存・整理・共有できるツール。バイブコーディングに最適化。",
    url: "https://myprompt-one.vercel.app",
    siteName: "マイプロンプト",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "マイプロンプト",
    description: "バイブコーダーのためのプロンプト簡単メモサイト",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-config" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:true});`}
            </Script>
          </>
        )}
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-700`}
      >
        <AbortErrorSuppressor />
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
