"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const breadcrumbMap: Record<string, string> = {
  dashboard: "Dashboard",
  pos: "Punto de Venta",
  orders: "Órdenes",
  encargos: "Encargos",
  products: "Productos",
  schools: "Escuelas",
  catalog: "Catálogo",
  reports: "Reportes",
  consulta: "Consulta",
  filtro: "Filtro Inventario",
  new: "Nuevo",
  edit: "Editar",
  manage: "Gestionar",
  "work-order": "Orden de Trabajo",
};

function Breadcrumb() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  const crumbs = parts
    .filter((p) => !["admin"].includes(p))
    .map((p) => breadcrumbMap[p] ?? p);

  return (
    <nav className="flex items-center gap-1 text-sm">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && (
            <ChevronRight size={13} className="text-muted-foreground/50" />
          )}
          <span
            className={cn(
              i === crumbs.length - 1
                ? "font-medium text-foreground"
                : "text-muted-foreground"
            )}
          >
            {crumb}
          </span>
        </span>
      ))}
    </nav>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Cambiar tema"
    >
      <Sun size={15} className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon size={15} className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
      <Breadcrumb />
      <div className="flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  );
}
