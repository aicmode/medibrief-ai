import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediBrief｜受診メモを整理する",
  description:
    "体調や症状の自由入力を、診察で医師に伝えやすい受診メモに整理するツールです。診断は行いません。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  );
}
