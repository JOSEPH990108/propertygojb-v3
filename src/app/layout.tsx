import { AppConfirmProvider } from "@/components/common/app-confirm-provider";
import { AppThemeProvider } from "@/components/common/app-theme-provider";
import { PageTransitionProvider } from "@/components/common/page-transition-provider";
import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";

import { AppToastProvider } from "@/components/common/app-toast-provider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Editorial display serif used by the public marketing `font-serif` utility (see globals.css).
const displaySerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
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
      {/* A public-route inline script sets data-ui="public" here before hydration
          (see src/components/common/inline-script.tsx); suppress the resulting,
          expected DOM/props mismatch for this one attribute. */}
      <body
        className={`${inter.className} ${displaySerif.variable} antialiased`}
        suppressHydrationWarning
      >
        <AppThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PageTransitionProvider>{children}</PageTransitionProvider>
          <AppToastProvider />
          <AppConfirmProvider />
        </AppThemeProvider>
      </body>
    </html>
  );
}
