"use client";

import { useState, useCallback, useEffect } from "react";
import { PanelLeft } from "lucide-react";
import Sidebar from "./Sidebar";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(320);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [isLg, setIsLg] = useState<boolean>(false);

  const open = useCallback(() => setSidebarOpen(true), []);
  const close = useCallback(() => setSidebarOpen(false), []);
  const toggle = useCallback(() => setSidebarOpen((v) => !v), []);

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("__sidebar_width__")
        : null;
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!Number.isNaN(parsed)) setSidebarWidth(parsed);
    }
    const savedCollapsed =
      typeof window !== "undefined"
        ? window.localStorage.getItem("__sidebar_collapsed__")
        : null;
    if (savedCollapsed === "1") setCollapsed(true);
    const mq =
      typeof window !== "undefined"
        ? window.matchMedia("(min-width: 1024px)")
        : null;
    const update = () => setIsLg(!!mq?.matches);
    update();
    mq?.addEventListener("change", update);
    return () => mq?.removeEventListener("change", update);
  }, []);

  const handleResize = useCallback((w: number) => {
    setSidebarWidth(w);
    try {
      window.localStorage.setItem("__sidebar_width__", String(w));
    } catch {}
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((v) => {
      const next = !v;
      try {
        window.localStorage.setItem("__sidebar_collapsed__", next ? "1" : "0");
      } catch {}
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={close}
        width={
          isLg
            ? collapsed
              ? 72
              : sidebarWidth
            : Math.min(280, Math.max(220, sidebarWidth))
        }
        onResize={handleResize}
        collapsed={isLg ? collapsed : false}
      />
      <div className="lg:pl-0">
        {/* Expose a custom event for Navbar to toggle sidebar on mobile */}
        <button
          id="__sidebar-toggle__"
          onClick={toggle}
          className="sr-only"
          aria-hidden
        />
        {/* Top header with PanelLeft button aligned right; match sidebar header height */}
        <div
          className="sticky top-0 z-30 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40"
          style={{
            marginLeft: isLg ? `${collapsed ? 72 : sidebarWidth}px` : 0,
          }}
        >
          <div className="px-4 sm:px-8 h-14 sm:h-16 border-b border-border flex items-center justify-start">
            <button
              onClick={() => {
                if (isLg) toggleCollapsed();
                else open();
              }}
              className="inline-flex items-center justify-center rounded-md border border-border p-1.5 hover:bg-muted/40"
              aria-label="Toggle panel"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
        <main
          className="px-4 sm:px-8 pb-10"
          style={{
            marginLeft: isLg ? `${collapsed ? 72 : sidebarWidth}px` : 0,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
