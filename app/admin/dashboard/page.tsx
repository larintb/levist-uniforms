"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { Plus, ImageOff, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Package, TrendingUp, Layers, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/admin/PageHeader";
import { cn } from "@/lib/utils";

type InventoryItem = {
  inventory_id: string;
  product_id: string;
  product_name: string;
  color: string;
  sku: string;
  size: string;
  stock: number;
  price: number;
  brand: string;
  collection: string;
  category: string;
  image_url: string | null;
};

const tableHeaders: { key: keyof InventoryItem; label: string; sortable: boolean; className?: string }[] = [
  { key: "image_url", label: "", sortable: false, className: "w-10" },
  { key: "product_name", label: "Producto", sortable: true },
  { key: "sku", label: "SKU", sortable: true },
  { key: "size", label: "Talla", sortable: true },
  { key: "stock", label: "Stock", sortable: true, className: "text-center" },
  { key: "price", label: "Precio", sortable: true, className: "text-right" },
  { key: "inventory_id", label: "", sortable: false, className: "w-16" },
];

function SortIcon({ direction }: { direction: "ascending" | "descending" | null }) {
  if (!direction) return null;
  return direction === "ascending" ? (
    <ChevronUp size={13} className="inline ml-1" />
  ) : (
    <ChevronDown size={13} className="inline ml-1" />
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
        <Icon size={14} className="text-muted-foreground/60" />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {loading ? (
          <Skeleton className="h-7 w-24 mt-1" />
        ) : (
          <p className="text-2xl font-semibold font-mono tabular-nums text-foreground">
            {value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return (
      <Badge variant="destructive" className="font-mono tabular-nums text-xs">
        {stock}
      </Badge>
    );
  if (stock < 5)
    return (
      <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 font-mono tabular-nums text-xs hover:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800">
        {stock}
      </Badge>
    );
  return (
    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 font-mono tabular-nums text-xs hover:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800">
      {stock}
    </Badge>
  );
}

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InventoryItem;
    direction: "ascending" | "descending";
  } | null>({ key: "product_name", direction: "ascending" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({
    pendingEmbroideryOrders: 0,
    variantsInStock: 0,
    totalInventoryValue: 0,
    ordersThisMonth: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let query = supabase
        .from("full_inventory_details")
        .select("*", { count: "exact" });
      if (searchTerm) {
        query = query.or(
          `product_name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`
        );
      }
      if (sortConfig) {
        query = query.order(sortConfig.key, {
          ascending: sortConfig.direction === "ascending",
        });
      }
      const startIndex = (currentPage - 1) * itemsPerPage;
      query = query.range(startIndex, startIndex + itemsPerPage - 1);
      const { data, error: fetchError, count } = await query;
      if (fetchError) throw fetchError;
      setInventory(data || []);
      setTotalItems(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [supabase, searchTerm, sortConfig, currentPage, itemsPerPage]);

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const { count: pendingEmbroideryOrders } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .or("status.eq.PENDING_EMBROIDERY");
      const { count: variantsInStock } = await supabase
        .from("inventory")
        .select("id", { count: "exact", head: true })
        .gt("stock", 0);
      const { data: inventoryData } = await supabase
        .from("full_inventory_details")
        .select("stock, price, product_name")
        .gt("stock", 0)
        .not("product_name", "ilike", "%Bordado%")
        .not("product_name", "ilike", "%Bordado Promo%");
      const totalInventoryValue =
        inventoryData?.reduce((t, i) => t + i.stock * i.price, 0) || 0;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { count: ordersThisMonth } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());
      setStats({
        pendingEmbroideryOrders: pendingEmbroideryOrders || 0,
        variantsInStock: variantsInStock || 0,
        totalInventoryValue,
        ordersThisMonth: ordersThisMonth || 0,
      });
    } catch (err) {
      console.error("Error cargando estadísticas:", err);
    } finally {
      setLoadingStats(false);
    }
  }, [supabase]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, itemsPerPage]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const requestSort = useCallback(
    (key: keyof InventoryItem) => {
      setSortConfig((prev) => ({
        key,
        direction:
          prev?.key === key && prev.direction === "ascending"
            ? "descending"
            : "ascending",
      }));
      setCurrentPage(1);
    },
    []
  );

  const statCards = useMemo(
    () => [
      {
        title: "Órdenes Bordado Pendientes",
        value: stats.pendingEmbroideryOrders,
        icon: Package,
      },
      {
        title: "Variantes en Stock",
        value: stats.variantsInStock,
        icon: Layers,
      },
      {
        title: "Valor Inventario",
        value: `$${stats.totalInventoryValue.toLocaleString("es-MX", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`,
        icon: TrendingUp,
      },
      {
        title: "Órdenes Este Mes",
        value: stats.ordersThisMonth,
        icon: ShoppingBag,
      },
    ],
    [stats]
  );

  return (
    <div className="p-6">
      <PageHeader
        title="Dashboard"
        description="Resumen de inventario y actividad"
        actions={
          <Button asChild size="sm">
            <Link href="/admin/products/new">
              <Plus size={14} />
              Nuevo Producto
            </Link>
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => (
          <StatCard
            key={s.title}
            title={s.title}
            value={s.value}
            icon={s.icon}
            loading={loadingStats}
          />
        ))}
      </div>

      {/* Inventory table */}
      <Card>
        <CardHeader className="px-4 pt-4 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Inventario Actual</CardTitle>
          <Input
            type="text"
            placeholder="Buscar producto, SKU, marca…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 w-64 text-sm"
          />
        </CardHeader>

        <div className="border-t border-border">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-center text-destructive text-sm py-8">{error}</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {tableHeaders.map((h) => (
                        <TableHead
                          key={h.key}
                          className={cn(
                            "h-9 text-xs",
                            h.className,
                            h.sortable &&
                              "cursor-pointer select-none hover:text-foreground"
                          )}
                          onClick={() => h.sortable && requestSort(h.key)}
                        >
                          {h.label}
                          {h.sortable && (
                            <SortIcon
                              direction={
                                sortConfig?.key === h.key
                                  ? sortConfig.direction
                                  : null
                              }
                            />
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item.inventory_id} className="h-11">
                        <TableCell className="py-1.5">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.product_name}
                              width={32}
                              height={32}
                              className="size-8 rounded-md object-cover"
                            />
                          ) : (
                            <div className="size-8 flex items-center justify-center rounded-md bg-muted">
                              <ImageOff size={13} className="text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-1.5">
                          <p className="text-sm font-medium text-foreground">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.color}
                          </p>
                        </TableCell>
                        <TableCell className="py-1.5 font-mono text-xs text-muted-foreground">
                          {item.sku}
                        </TableCell>
                        <TableCell className="py-1.5 text-sm text-muted-foreground">
                          {item.size}
                        </TableCell>
                        <TableCell className="py-1.5 text-center">
                          <StockBadge stock={item.stock} />
                        </TableCell>
                        <TableCell className="py-1.5 text-right font-mono text-sm tabular-nums">
                          ${item.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-1.5 text-right">
                          <Button variant="ghost" size="xs" asChild>
                            <Link href={`/admin/products/${item.product_id}/edit`}>
                              Editar
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">
                    {Math.min(1 + (currentPage - 1) * itemsPerPage, totalItems)}–
                    {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}
                  </p>
                  <Select
                    value={String(itemsPerPage)}
                    onValueChange={(v) => setItemsPerPage(Number(v))}
                  >
                    <SelectTrigger className="h-7 w-[72px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 25, 50, 100].map((n) => (
                        <SelectItem key={n} value={String(n)} className="text-xs">
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft size={13} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={13} />
                  </Button>
                  <span className="text-xs text-muted-foreground px-2 tabular-nums">
                    {currentPage} / {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight size={13} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronsRight size={13} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
