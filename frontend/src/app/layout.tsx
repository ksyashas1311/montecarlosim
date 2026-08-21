import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinTwin — Your Financial Future, Simulated",
  description: "Personal Financial Digital Twin + Monte Carlo Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark antialiased">
      <body className="h-full bg-[#0b0f14] text-[#f0f4f9] antialiased">
        {children}
      </body>
    </html>
  );
}
