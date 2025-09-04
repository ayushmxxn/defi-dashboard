import type { Metadata } from "next";
import { ThemeProvider } from "@/providers/theme-provider";
import { WalletProvider } from "@/contexts/WalletContext";
import Navbar from "@/components/layout/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeFi Pools",
  description: "Discover DeFi yield opportunities",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <WalletProvider>
            <Navbar />
            {children}
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
