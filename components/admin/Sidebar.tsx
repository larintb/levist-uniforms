"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Package,
  GraduationCap,
  ScanBarcode,
  Filter,
  LayoutGrid,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { signout } from "@/app/login/actions";

const operationLinks = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Punto de Venta", href: "/admin/pos", icon: CreditCard },
  { name: "Órdenes", href: "/admin/orders", icon: ShoppingCart },
  { name: "Encargos", href: "/admin/encargos", icon: ClipboardList },
  { name: "Consulta", href: "/admin/consulta", icon: ScanBarcode },
];

const catalogLinks = [
  { name: "Productos", href: "/admin/products", icon: Package },
  { name: "Escuelas", href: "/admin/schools", icon: GraduationCap },
  { name: "Catálogo", href: "/admin/catalog", icon: LayoutGrid },
  { name: "Filtro Inventario", href: "/admin/filtro", icon: Filter },
  { name: "Reportes", href: "/admin/reports", icon: BarChart3 },
];

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

function NavItem({
  link,
  isActive,
  isCollapsed,
}: {
  link: { name: string; href: string; icon: React.ElementType };
  isActive: boolean;
  isCollapsed: boolean;
}) {
  const Icon = link.icon;
  const item = (
    <Link
      href={link.href}
      className={cn(
        "group relative flex h-8 items-center gap-2.5 rounded-md px-2 text-sm font-medium transition-colors",
        isCollapsed ? "justify-center px-0 w-8 mx-auto" : "",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {isActive && (
        <span className={cn(
          "absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary",
          isCollapsed && "left-[-8px]"
        )} />
      )}
      <Icon size={15} className="shrink-0" />
      {!isCollapsed && <span className="truncate">{link.name}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{item}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {link.name}
        </TooltipContent>
      </Tooltip>
    );
  }

  return item;
}

export function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className={cn(
        "flex h-14 items-center border-b border-sidebar-border px-3",
        isCollapsed ? "justify-center" : "gap-2.5"
      )}>
        <div className="relative size-6 shrink-0 overflow-hidden rounded-md">
          <Image
            src="/logo.jpg"
            alt="Levist"
            fill
            className="object-cover"
          />
        </div>
        {!isCollapsed && (
          <span className="font-semibold text-sm text-sidebar-foreground tracking-tight">
            Levist
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {/* Operación */}
        {!isCollapsed && (
          <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Operación
          </p>
        )}
        {isCollapsed && <div className="h-4" />}
        <div className="space-y-0.5">
          {operationLinks.map((link) => (
            <NavItem
              key={link.href}
              link={link}
              isActive={pathname.startsWith(link.href)}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>

        <Separator className="my-3 bg-sidebar-border" />

        {/* Catálogo */}
        {!isCollapsed && (
          <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Catálogo
          </p>
        )}
        <div className="space-y-0.5">
          {catalogLinks.map((link) => (
            <NavItem
              key={link.href}
              link={link}
              isActive={pathname.startsWith(link.href)}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-0.5">
        <form action={signout}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="submit"
                className={cn(
                  "flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
                  isCollapsed && "justify-center px-0"
                )}
              >
                <LogOut size={15} className="shrink-0" />
                {!isCollapsed && <span>Cerrar Sesión</span>}
              </button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="text-xs">
                Cerrar Sesión
              </TooltipContent>
            )}
          </Tooltip>
        </form>

        <button
          onClick={toggleSidebar}
          className={cn(
            "flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
            isCollapsed && "justify-center px-0"
          )}
        >
          {isCollapsed ? (
            <ChevronRight size={15} className="shrink-0" />
          ) : (
            <>
              <ChevronLeft size={15} className="shrink-0" />
              <span>Colapsar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
