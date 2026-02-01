import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aura Pay Dashboard",
  description: "Payment records & analytics powered by Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="antialiased">{children}</body>
    </html>
  );
}
