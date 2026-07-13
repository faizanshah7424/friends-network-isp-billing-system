import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BillingSystemProvider } from "@/lib/context";
import { ThemeProvider } from "@/lib/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Friends Network - Billing & Customer Management System",
  description: "A premium ISP dashboard for Billing, Invoicing, Customers and Complaints Management.",
  icons: {
    icon: "/friends-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground font-sans flex flex-col">
        <ThemeProvider>
          <BillingSystemProvider>
            {children}
          </BillingSystemProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
