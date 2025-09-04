"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Info, GripVertical, Wallet } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  width?: number; // pixels
  onResizeStart?: () => void;
  onResize?: (width: number) => void;
  onResizeEnd?: () => void;
  collapsed?: boolean;
}

export default function Sidebar({
  isOpen,
  onClose,
  width = 256,
  onResize,
  onResizeStart,
  onResizeEnd,
  collapsed = false,
}: SidebarProps) {
  const { isWalletConnected, connectWallet } = useWallet();

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
          "transition-transform duration-200 ease-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ width }}
      >
        <div className="h-14 sm:h-16 border-b border-sidebar-border flex items-center justify-between gap-2 px-3">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2",
              collapsed && "justify-center w-full"
            )}
          >
            <Image
              src="https://i.postimg.cc/zvWm0TZs/a-modern-logo-design-featuring-defi-rend-s-Qge-IRz3-T3-G796fw3-c-Wcg-u-Jxyw-KMVT36-X5-Ntwg-PZPVw.jpg"
              alt="Logo"
              width={28}
              height={28}
              className="object-contain w-7 h-7 rounded-md"
            />
            {!collapsed && (
              <span className="text-sm sm:text-base font-semibold">
                DeFi Dashboard
              </span>
            )}
          </Link>
        </div>
        <nav className={cn("p-2 space-y-1", collapsed && "px-2")}>
          <a
            href="https://defillama.com/"
            target="_blank"
            rel="noreferrer"
            className={cn(
              "group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center"
            )}
          >
            <Info className="h-4 w-4" />
            {!collapsed && <span>Docs</span>}
          </a>
        </nav>
        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-2">
          <div
            className={cn(
              "flex gap-2",
              collapsed
                ? "flex-col items-center"
                : "justify-between items-center"
            )}
          >
            <ThemeToggle />
            <Button
              onClick={connectWallet}
              className={cn(
                "px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/80 text-xs font-semibold disabled:opacity-50",
                collapsed && "p-2"
              )}
              disabled={isWalletConnected}
            >
              {collapsed ? (
                <Wallet className="h-4 w-4" />
              ) : isWalletConnected ? (
                "Connected"
              ) : (
                <>
                  <Wallet className="h-4 w-4 " />
                  Connect Wallet
                </>
              )}
            </Button>
          </div>
        </div>
        {/* Resize handle on the right edge */}
        <div
          className="absolute top-0 right-0 h-full w-2 cursor-col-resize group"
          onMouseDown={(e) => {
            e.preventDefault();
            if (collapsed) return;
            onResizeStart?.();
            const startX = e.clientX;
            const startWidth = width;
            const onMove = (moveEvent: MouseEvent) => {
              const delta = moveEvent.clientX - startX;
              const next = Math.min(420, Math.max(200, startWidth + delta));
              onResize?.(next);
            };
            const onUp = () => {
              onResizeEnd?.();
              window.removeEventListener("mousemove", onMove);
              window.removeEventListener("mouseup", onUp);
            };
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
          }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-md border border-sidebar-border bg-sidebar p-1 shadow-sm">
            <GripVertical className="h-4 w-4 opacity-60 group-hover:opacity-100" />
          </div>
        </div>
      </aside>
    </>
  );
}
