"use client";

import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "../ThemeToggle";
import { Wallet, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";

export default function Navbar() {
  const { isWalletConnected, connectWallet } = useWallet();

  return (
    <>
      <nav
        className={`
          fixed top-0 left-0 right-0 z-50
          py-2 sm:py-4
          px-4 sm:px-8
          bg-background/30
          text-foreground
          backdrop-blur-md
          border-b border-border
        `}
      >
        <div className="flex items-center justify-between mx-auto">
          {/* Left Side: Logo and Name */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="https://i.postimg.cc/zvWm0TZs/a-modern-logo-design-featuring-defi-rend-s-Qge-IRz3-T3-G796fw3-c-Wcg-u-Jxyw-KMVT36-X5-Ntwg-PZPVw.jpg"
              alt="Logo"
              width={80}
              height={80}
              className="object-contain w-7 h-7 sm:w-10 sm:h-10 rounded-md"
            />
            <span className="text-sm sm:text-lg font-semibold text-foreground">
              DeFi Dashboard
            </span>
          </Link>

          {/* Right Side: Mobile menu toggle, Theme Toggle and Connect Wallet */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              className="inline-flex lg:hidden items-center justify-center rounded-md border border-border p-2 hover:bg-muted/40"
              aria-label="Toggle sidebar"
              onClick={() => {
                const btn = document.getElementById("__sidebar-toggle__");
                btn?.click();
              }}
            >
              <Menu className="h-5 w-5" />
            </button>
            <ThemeToggle />
            <Button
              onClick={connectWallet}
              className={`
                flex items-center space-x-1
                px-2.5 py-1.5 sm:px-4 sm:py-2
                rounded-sm sm:rounded-md
                bg-primary text-primary-foreground
                hover:bg-primary/80
                transition-all duration-200
                text-xs sm:text-sm font-semibold
                disabled:opacity-50  cursor-pointer
              `}
              disabled={isWalletConnected}
            >
              <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{isWalletConnected ? "Connected" : "Connect Wallet"}</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Spacer div to push content down */}
      <div className="h-14 sm:h-20"></div>
    </>
  );
}
