import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "SPMC Hospital Management System",
  description:
    "Hospital management system for Southern Philippines Medical Center (SPMC).",
  icons: {
    icon: [
      {
        url: "/assets/spmc_logo.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: [
      {
        url: "/assets/spmc_logo.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-hospital-surface text-hospital-text">
        {children}
      </body>
    </html>
  );
}
