import { AppConfirmProvider } from "@/components/common/app-confirm-provider";
import { AppThemeProvider } from "@/components/common/app-theme-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AppToastProvider } from "@/components/common/app-toast-provider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PropertyGoJB",
  description: "Modern property showcase, agent portal, and admin portal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <AppThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <AppToastProvider />
          <AppConfirmProvider />
        </AppThemeProvider>
        </body>
    </html>
  );
}
