import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "나의 가계부",
  description: "개인 수입/지출 가계부",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
