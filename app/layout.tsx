import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thanh Tuyen & Ngoc Huyen Wedding Invitation",
  description: "A Next.js clone of Cocohappii wedding invitation template 009.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
