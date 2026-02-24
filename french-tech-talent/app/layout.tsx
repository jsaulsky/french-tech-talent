import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "French Tech Updates — Talent Pool",
  description: "Join the French Tech talent pool and get matched to exciting opportunities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ backgroundColor: "#FFFBF2", color: "#2E3A44" }}>
        {children}
      </body>
    </html>
  );
}
