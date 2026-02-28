import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { idID } from "@clerk/localizations";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "@/components/ui/sonner";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Gerakan Suka Baca",
  description: "Bergerak untuk berdampak",
  icons: {
    icon: "/favicon.ico",     
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider localization={idID}>
      <html lang="id" suppressHydrationWarning>
        <body className={`${montserrat.variable} ${openSans.variable} antialiased`}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <TRPCReactProvider>{children}</TRPCReactProvider>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
