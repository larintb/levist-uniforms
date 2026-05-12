"use client";

import { Sidebar } from "@/components/admin/Sidebar";
import { Topbar } from "@/components/admin/Topbar";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out print:hidden",
          isCollapsed ? "w-14" : "w-56"
        )}
      >
        <Sidebar
          isCollapsed={isCollapsed}
          toggleSidebar={() => setIsCollapsed((p) => !p)}
        />
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 ease-in-out print:pl-0",
          isCollapsed ? "pl-14" : "pl-56"
        )}
      >
        <Topbar />
        <main className="flex-1 min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
