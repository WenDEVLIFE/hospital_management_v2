import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPMC Platform | Southern Philippines Medical Center",
  description:
    "Integrated System & Documentation Generation Platform for Southern Philippines Medical Center (SPMC)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-hospital-surface text-hospital-text">
        {children}
      </body>
    </html>
  );
}
