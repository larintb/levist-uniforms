"use client";

import React, { useState, useEffect, useTransition, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  getSchools,
  createEncargoAction,
  getEncargos,
  fulfillEncargoAction,
  cancelEncargoAction,
  Encargo,
  CreateEncargoPayload,
} from "./actions";
import { GroupedProduct, ProductColorVariant, ProductVariant } from "@/app/admin/pos/actions";
import { createClient } from "@/lib/supabase/client";
import toast, { Toaster } from "react-hot-toast";
import {
  Search, Trash2, Check, X, Printer, PackagePlus, ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type School = { id: string; name: string };
type CartItem = {
  inventory_id: string;
  product_name: string;
  product_image: string | null;
  size: string;
  color: string;
  price: number;
  quantity: number;
  sku: string;
};

// --- Status badge ---
const statusMap = {
  PENDING: { label: "Pendiente", className: "bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800" },
  FULFILLED: { label: "Cobrado", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800" },
  CANCELLED: { label: "Cancelado", className: "bg-muted text-muted-foreground border-border" },
} as const;

const StatusBadge = ({ status }: { status: string }) => {
  const s = statusMap[status as keyof typeof statusMap] ?? { label: status, className: "bg-muted text-muted-foreground border-border" };
  return <Badge variant="outline" className={cn("text-xs font-medium", s.className)}>{s.label}</Badge>;
};

// --- Variant Selection Modal ---
const VariantModal = ({
  product, onClose, onAdd,
}: {
  product: GroupedProduct; onClose: () => void; onAdd: (item: CartItem) => void;
}) => {
  const [selectedColor, setSelectedColor] = useState<ProductColorVariant | null>(
    product.colors.length === 1 ? product.colors[0] : null
  );
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    if (selectedColor?.variants.length === 1) setSelectedVariant(selectedColor.variants[0]);
    else setSelectedVariant(null);
  }, [selectedColor]);

  const handleAdd = () => {
    if (selectedVariant && selectedColor) {
      onAdd({
        inventory_id: selectedVariant.inventory_id,
        product_name: product.product_name,
        product_image: selectedColor.product_image,
        size: selectedVariant.size,
        color: selectedColor.color,
        price: selectedVariant.price,
        quantity: 1,
        sku: product.sku_base,
      });
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{product.product_name}</DialogTitle>
          <p className="text-xs text-muted-foreground font-mono">SKU: {product.sku_base}</p>
        </DialogHeader>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Color</p>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <button
                key={c.color}
                onClick={() => setSelectedColor(c)}
                className={cn(
                  "flex flex-col items-center p-2 rounded-lg border-2 transition-all",
                  selectedColor?.color === c.color ? "border-primary" : "border-border hover:border-muted-foreground"
                )}
              >
                <Image src={c.product_image || "/placeholder.jpg"} alt={c.color} width={56} height={56} className="w-14 h-14 object-cover rounded-md" />
                <p className="text-xs font-medium mt-1.5 text-foreground">{c.color}</p>
              </button>
            ))}
          </div>
        </div>

        {selectedColor && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Talla</p>
            <div className="flex flex-wrap gap-2">
              {selectedColor.variants.map((v) => (
                <button
                  key={v.inventory_id}
                  onClick={() => setSelectedVariant(v)}
                  className={cn(
                    "relative px-4 py-2 rounded-md text-sm font-semibold border-2 transition-all",
                    selectedVariant?.inventory_id === v.inventory_id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:border-muted-foreground"
                  )}
                >
                  {v.size}
                  {v.stock === 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />}
                </button>
              ))}
            </div>
            {selectedVariant && (
              <p className="text-xs text-muted-foreground mt-2 flex gap-3">
                <span>Precio: <strong className="text-foreground font-mono">${selectedVariant.price.toFixed(2)}</strong></span>
                <span>Existencia: <strong className={selectedVariant.stock === 0 ? "text-destructive" : "text-emerald-600"}>{selectedVariant.stock}</strong></span>
              </p>
            )}
          </div>
        )}

        <Button onClick={handleAdd} disabled={!selectedVariant} className="w-full">
          Agregar al Encargo
        </Button>
      </DialogContent>
    </Dialog>
  );
};

// --- Checkout Modal ---
const CheckoutModal = ({
  encargo, onClose, onConfirm, isProcessing,
}: {
  encargo: Encargo; onClose: () => void;
  onConfirm: (data: { paymentMethod: string; isLayaway: boolean; downPayment: number; discountAmount: number; discountReason: string }) => void;
  isProcessing: boolean;
}) => {
  const subtotal = encargo.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const depositPaid = encargo.deposit;
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [isLayaway, setIsLayaway] = useState(false);
  const [additionalDeposit, setAdditionalDeposit] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountReason, setDiscountReason] = useState("");

  const total = Math.max(0, subtotal - discountAmount);
  const pendingBalance = Math.max(0, total - depositPaid);
  const finalDownPayment = depositPaid + (isLayaway ? additionalDeposit : pendingBalance);
  const finalRemaining = isLayaway ? pendingBalance - additionalDeposit : 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Cobrar Encargo</DialogTitle>
          <p className="text-sm text-muted-foreground">{encargo.customer_name}</p>
        </DialogHeader>

        {/* Items */}
        <div className="bg-muted/40 rounded-lg p-3 max-h-36 overflow-y-auto space-y-1">
          {encargo.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.quantity}× {item.product_name} <span className="text-muted-foreground/60">({item.size}/{item.color})</span></span>
              <span className="font-medium font-mono">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Amounts */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono">${subtotal.toFixed(2)}</span>
          </div>
          {depositPaid > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Anticipo pagado</span>
              <span className="font-mono">−${depositPaid.toFixed(2)}</span>
            </div>
          )}

          {/* Discount */}
          <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descuento <span className="font-normal normal-case">(opcional)</span></p>
            <div className="flex gap-2">
              <div className="flex items-center bg-background border border-input rounded-md px-2 py-1.5 w-28">
                <span className="text-xs text-muted-foreground mr-1">$</span>
                <input
                  type="number" min={0} max={subtotal} step={1}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Math.min(parseFloat(e.target.value) || 0, subtotal))}
                  className="flex-1 text-sm font-mono bg-transparent outline-none w-0 min-w-0 text-foreground"
                />
              </div>
              <Input
                placeholder="Razón..."
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                className="flex-1 h-8 text-sm"
              />
            </div>
          </div>

          <Separator />
          <div className="flex justify-between font-semibold text-base">
            <span>Saldo a cobrar</span>
            <span className="font-mono">${pendingBalance.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment method */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Método de Pago</p>
          <div className="flex gap-2">
            {["Efectivo", "Tarjeta", "Transferencia"].map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={cn(
                  "flex-1 py-2 rounded-md text-sm font-medium border-2 transition-all",
                  paymentMethod === m
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:border-muted-foreground"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Partial payment */}
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox" checked={isLayaway}
            onChange={(e) => { setIsLayaway(e.target.checked); setAdditionalDeposit(0); }}
            className="w-4 h-4 rounded accent-primary"
          />
          <span className="text-sm font-medium">El cliente paga solo una parte ahora</span>
        </label>
        {isLayaway && (
          <div className="bg-amber-500/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <label className="text-xs text-muted-foreground block mb-1.5">Pago adicional ahora</label>
            <Input
              type="number" min={0} max={pendingBalance}
              value={additionalDeposit}
              onChange={(e) => setAdditionalDeposit(parseFloat(e.target.value) || 0)}
              className="h-8 text-sm font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Saldo pendiente: <strong className="text-amber-600 font-mono">${finalRemaining.toFixed(2)}</strong>
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button
            onClick={() => onConfirm({ paymentMethod, isLayaway, downPayment: finalDownPayment, discountAmount, discountReason })}
            disabled={isProcessing}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isProcessing ? "Procesando..." : "Confirmar Cobro"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================
// Main Page
// ============================================================
export default function EncargosPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"nuevo" | "lista">("nuevo");
  const supabase = createClient();
  const [schools, setSchools] = useState<School[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GroupedProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<GroupedProduct | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [embroideryNotes, setEmbroideryNotes] = useState("");
  const [deposit, setDeposit] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState("");
  const [isCreating, startCreating] = useTransition();
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [encargos, setEncargos] = useState<Encargo[]>([]);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [searchClient, setSearchClient] = useState("");
  const [selectedEncargo, setSelectedEncargo] = useState<Encargo | null>(null);
  const [checkoutEncargo, setCheckoutEncargo] = useState<Encargo | null>(null);
  const [isLoadingList, startLoadingList] = useTransition();
  const [isFulfilling, startFulfilling] = useTransition();
  const [isCancelling, startCancelling] = useTransition();

  useEffect(() => {
    getSchools().then(setSchools as (s: { id: string; name: string }[]) => void);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) { setSearchResults([]); setIsSearching(false); return; }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const term = `%${searchQuery.trim()}%`;
      const { data, error } = await supabase
        .from("full_inventory_details")
        .select("inventory_id, product_name, sku, color, size, stock, price, barcode, product_image")
        .or(`product_name.ilike.${term},sku.ilike.${term}`)
        .order("product_name", { ascending: true })
        .order("size", { ascending: true });
      if (error) { setIsSearching(false); return; }
      const productMap = new Map<string, GroupedProduct>();
      for (const item of data || []) {
        if (!productMap.has(item.sku)) productMap.set(item.sku, { sku_base: item.sku, product_name: item.product_name, colors: [] });
        const gp = productMap.get(item.sku)!;
        let cv = gp.colors.find((c) => c.color === item.color);
        if (!cv) { cv = { color: item.color, product_image: item.product_image, variants: [] }; gp.colors.push(cv); }
        cv.variants.push({ inventory_id: item.inventory_id, size: item.size, stock: item.stock, price: item.price, barcode: item.barcode });
      }
      setSearchResults(Array.from(productMap.values()).slice(0, 10));
      setIsSearching(false);
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadEncargos = useCallback(() => {
    startLoadingList(async () => {
      const data = await getEncargos(statusFilter !== "ALL" ? statusFilter : undefined);
      setEncargos(data);
      setSelectedEncargo((prev) => {
        if (!prev) return null;
        return data.find((e) => e.id === prev.id) || null;
      });
    });
  }, [statusFilter]);

  useEffect(() => {
    if (activeTab === "lista") loadEncargos();
  }, [activeTab, loadEncargos]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.inventory_id === item.inventory_id);
      if (existing) return prev.map((i) => i.inventory_id === item.inventory_id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, item];
    });
    setSelectedProduct(null); setSearchQuery(""); setShowResults(false);
  };

  const removeFromCart = (inventory_id: string) => setCart((prev) => prev.filter((i) => i.inventory_id !== inventory_id));
  const updateCartPrice = (inventory_id: string, price: number) => setCart((prev) => prev.map((i) => i.inventory_id === inventory_id ? { ...i, price } : i));
  const updateCartQty = (inventory_id: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) => prev.map((i) => i.inventory_id === inventory_id ? { ...i, quantity } : i));
  };

  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartTotal = Math.max(0, cartSubtotal - discount);

  const handleCreateEncargo = () => {
    if (!customerName.trim()) { toast.error("El nombre del cliente es requerido"); return; }
    if (cart.length === 0) { toast.error("Agrega al menos un producto"); return; }
    startCreating(async () => {
      const payload: CreateEncargoPayload = {
        customerName: customerName.trim(), customerPhone: customerPhone.trim(), schoolId,
        embroideryNotes: embroideryNotes.trim(), notes: "", deposit, discount,
        discountReason: discountReason.trim(),
        items: cart.map((i) => ({ inventory_id: i.inventory_id, quantity: i.quantity, price: i.price })),
      };
      const result = await createEncargoAction(payload);
      if (result.success && result.encargoId) {
        toast.success("Encargo creado");
        setCart([]); setCustomerName(""); setCustomerPhone(""); setSchoolId(null);
        setEmbroideryNotes(""); setDeposit(0); setDiscount(0); setDiscountReason(""); setSearchQuery("");
        router.push(`/admin/encargos/${result.encargoId}`);
      } else {
        toast.error(result.message || "Error al crear encargo");
      }
    });
  };

  const handleFulfill = ({ paymentMethod, isLayaway, downPayment, discountAmount, discountReason }: { paymentMethod: string; isLayaway: boolean; downPayment: number; discountAmount: number; discountReason: string }) => {
    if (!checkoutEncargo) return;
    const subtotal = checkoutEncargo.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const total = Math.max(0, subtotal - discountAmount);
    const remaining = isLayaway ? total - downPayment : 0;
    startFulfilling(async () => {
      const result = await fulfillEncargoAction({
        encargoId: checkoutEncargo.id, paymentMethod, total, subtotal, discountAmount, discountReason,
        isLayaway, downPayment, remainingBalance: remaining,
      });
      if (result.success && result.orderId) {
        toast.success("Encargo cobrado — orden creada");
        setCheckoutEncargo(null); loadEncargos();
        router.push(`/admin/orders/${result.orderId}`);
      } else {
        toast.error(result.message || "Error al cobrar encargo");
      }
    });
  };

  const handleCancel = (encargo: Encargo) => {
    if (!confirm(`¿Cancelar el encargo de ${encargo.customer_name}?`)) return;
    startCancelling(async () => {
      const result = await cancelEncargoAction(encargo.id);
      if (result.success) {
        toast.success("Encargo cancelado"); loadEncargos();
        if (selectedEncargo?.id === encargo.id) setSelectedEncargo(null);
      } else {
        toast.error(result.message || "Error al cancelar");
      }
    });
  };

  const filteredEncargos = encargos.filter((e) => {
    if (!searchClient.trim()) return true;
    const q = searchClient.toLowerCase();
    return e.customer_name.toLowerCase().includes(q) || (e.customer_phone || "").includes(q) || e.id.slice(0, 8).includes(q);
  });

  const inputClass = "w-full border border-input rounded-md px-3 py-2 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition";

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 3.5rem)" }}>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Encargos</h1>
            <p className="text-xs text-muted-foreground">Pedidos de productos sin existencia</p>
          </div>
          <div className="flex gap-1 bg-muted rounded-md p-1">
            <button
              onClick={() => setActiveTab("nuevo")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors",
                activeTab === "nuevo" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <PackagePlus size={14} />
              Nuevo
            </button>
            <button
              onClick={() => setActiveTab("lista")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors",
                activeTab === "lista" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListOrdered size={14} />
              Encargos
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB: NUEVO ENCARGO */}
      {/* ============================================================ */}
      {activeTab === "nuevo" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Search + Cart */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto space-y-5">
                {/* Product Search */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Agregar producto</label>
                  <div className="relative" ref={searchRef}>
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="Buscar por SKU o nombre..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
                      onFocus={() => setShowResults(true)}
                      className="pl-8"
                    />
                    {showResults && searchQuery.trim().length >= 1 && (
                      <div className="absolute z-20 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                        {isSearching ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Buscando...</p>
                        ) : searchResults.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Sin resultados para &quot;{searchQuery}&quot;</p>
                        ) : (
                          <ul className="max-h-72 overflow-y-auto divide-y divide-border">
                            {searchResults.map((p) => (
                              <li key={p.sku_base}>
                                <button
                                  onClick={() => { setShowResults(false); setSelectedProduct(p); }}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
                                >
                                  <Image src={p.colors[0]?.product_image || "/placeholder.jpg"} alt={p.product_name} width={40} height={40} className="w-9 h-9 object-cover rounded-md bg-muted flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground truncate">{p.product_name}</p>
                                    <p className="text-xs text-muted-foreground font-mono">{p.sku_base} · {p.colors.length} color{p.colors.length !== 1 ? "es" : ""}</p>
                                  </div>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cart */}
                {cart.length > 0 ? (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Productos del encargo</p>
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <Card key={item.inventory_id}>
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground truncate">{item.product_name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 font-mono">{item.size} · {item.color} · {item.sku}</p>
                              </div>
                              <button onClick={() => removeFromCart(item.inventory_id)} className="text-muted-foreground/50 hover:text-destructive transition-colors mt-0.5">
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center bg-muted rounded-md overflow-hidden">
                                <button onClick={() => updateCartQty(item.inventory_id, item.quantity - 1)} className="px-2.5 py-1 text-muted-foreground hover:text-foreground hover:bg-accent text-sm font-bold transition-colors">−</button>
                                <span className="text-sm font-semibold text-foreground w-6 text-center tabular-nums">{item.quantity}</span>
                                <button onClick={() => updateCartQty(item.inventory_id, item.quantity + 1)} className="px-2.5 py-1 text-muted-foreground hover:text-foreground hover:bg-accent text-sm font-bold transition-colors">+</button>
                              </div>
                              <div className="flex items-center gap-1 flex-1 bg-muted/50 border border-input rounded-md px-2 py-1">
                                <span className="text-xs text-muted-foreground">$</span>
                                <input
                                  type="number" min={0} step={1} value={item.price}
                                  onChange={(e) => updateCartPrice(item.inventory_id, parseFloat(e.target.value) || 0)}
                                  className="flex-1 text-sm font-mono font-semibold text-foreground bg-transparent text-right outline-none w-0 min-w-0"
                                />
                              </div>
                              <span className="text-sm font-semibold font-mono shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {discount > 0 && (
                        <>
                          <div className="flex justify-between text-sm text-muted-foreground px-1">
                            <span>Subtotal</span><span className="font-mono">${cartSubtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-emerald-600 px-1">
                            <span>Descuento</span><span className="font-mono">−${discount.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between items-center px-1 pt-1 border-t border-border">
                        <span className="text-sm text-muted-foreground">Total estimado</span>
                        <span className="text-base font-semibold font-mono">${cartTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/40 border-2 border-dashed border-border rounded-xl">
                    <Search size={24} className="mb-2" />
                    <p className="text-sm">Busca y agrega productos al encargo</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Customer Form */}
          <div className="w-72 xl:w-80 flex flex-col bg-muted/30 border-l border-border overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datos del Cliente</p>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Nombre <span className="text-destructive">*</span></label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nombre completo" className="h-8 text-sm" />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Teléfono</label>
                <Input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="868-123-4567" className="h-8 text-sm" />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Escuela</label>
                <select
                  value={schoolId ?? ""}
                  onChange={(e) => setSchoolId(e.target.value || null)}
                  className={inputClass}
                  style={{ height: "32px", paddingTop: "0", paddingBottom: "0" }}
                >
                  <option value="">Ninguna</option>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Notas de bordado / pedido <span className="font-normal text-muted-foreground/60">(opcional)</span></label>
                <textarea
                  rows={3}
                  value={embroideryNotes}
                  onChange={(e) => setEmbroideryNotes(e.target.value)}
                  placeholder="Ej. Bordar nombre en cuello..."
                  className="w-full border border-input rounded-md px-3 py-2 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ring transition resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Anticipo <span className="font-normal text-muted-foreground/60">(opcional)</span></label>
                <div className="flex items-center bg-background border border-input rounded-md px-3 focus-within:ring-2 focus-within:ring-ring transition" style={{ height: "32px" }}>
                  <span className="text-xs text-muted-foreground mr-1.5">$</span>
                  <input type="number" min={0} step={1} value={deposit} onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)} className="flex-1 text-sm font-mono text-foreground bg-transparent outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Descuento <span className="font-normal text-muted-foreground/60">(opcional)</span></label>
                <div className="flex gap-2">
                  <div className="flex items-center bg-background border border-input rounded-md px-3 focus-within:ring-2 focus-within:ring-ring transition w-24" style={{ height: "32px" }}>
                    <span className="text-xs text-muted-foreground mr-1">$</span>
                    <input type="number" min={0} step={1} value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="flex-1 text-sm font-mono text-foreground bg-transparent outline-none w-0 min-w-0" />
                  </div>
                  <Input placeholder="Razón..." value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} className="flex-1 h-8 text-sm" />
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-border">
              <Button
                onClick={handleCreateEncargo}
                disabled={isCreating || cart.length === 0 || !customerName.trim()}
                className="w-full"
                size="sm"
              >
                {isCreating ? "Creando..." : "Crear Encargo"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: LISTA DE ENCARGOS */}
      {/* ============================================================ */}
      {activeTab === "lista" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Info notice */}
          <div className="mx-4 mt-3 bg-sky-500/10 border border-sky-200 dark:border-sky-800 rounded-lg px-4 py-2.5 shrink-0">
            <p className="text-xs text-sky-700 dark:text-sky-400">
              <strong>Aviso:</strong> Registra la entrada física de mercancía en el inventario <strong>antes</strong> de procesar y &quot;Cobrar&quot; un encargo.
            </p>
          </div>

          <div className="flex flex-1 overflow-hidden mt-3">
            {/* Left: List */}
            <div className="w-72 xl:w-80 flex flex-col border-r border-border bg-background overflow-hidden">
              <div className="p-3 border-b border-border space-y-2">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={searchClient}
                    onChange={(e) => setSearchClient(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <div className="flex gap-1">
                  {["PENDING", "FULFILLED", "CANCELLED", "ALL"].map((s) => (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s); setSelectedEncargo(null); }}
                      className={cn(
                        "flex-1 py-1 rounded text-xs font-medium transition-colors",
                        statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {s === "PENDING" ? "Pend." : s === "FULFILLED" ? "Cobr." : s === "CANCELLED" ? "Canc." : "Todos"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-border">
                {isLoadingList ? (
                  <p className="text-center text-muted-foreground text-sm py-8">Cargando...</p>
                ) : filteredEncargos.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">Sin encargos</p>
                ) : (
                  filteredEncargos.map((enc) => (
                    <button
                      key={enc.id}
                      onClick={() => setSelectedEncargo(enc)}
                      className={cn(
                        "w-full text-left p-3 hover:bg-accent transition-colors border-l-2",
                        selectedEncargo?.id === enc.id ? "bg-accent border-l-primary" : "border-l-transparent"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{enc.customer_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {enc.items.length} prod.{enc.customer_phone && ` · ${enc.customer_phone}`}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {new Date(enc.created_at).toLocaleDateString("es-MX")} · #{enc.id.slice(0, 8)}
                          </p>
                        </div>
                        <StatusBadge status={enc.status} />
                      </div>
                      <p className="text-xs font-semibold font-mono text-foreground mt-1.5">
                        ${enc.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}
                        {enc.deposit > 0 && <span className="text-emerald-600 font-normal font-sans ml-1.5">(anticipo ${enc.deposit.toFixed(2)})</span>}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right: Detail */}
            <div className="flex-1 overflow-y-auto bg-muted/20">
              {!selectedEncargo ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className="text-sm">Selecciona un encargo</p>
                </div>
              ) : (
                <div className="p-6 max-w-2xl space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-lg font-semibold text-foreground">{selectedEncargo.customer_name}</h2>
                        <StatusBadge status={selectedEncargo.status} />
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        #{selectedEncargo.id.slice(0, 8)} · {new Date(selectedEncargo.created_at).toLocaleString("es-MX", { timeZone: "America/Matamoros", dateStyle: "medium", timeStyle: "short" })}
                      </p>
                      {selectedEncargo.seller_name && (
                        <p className="text-xs text-muted-foreground mt-0.5">Vendedor: {selectedEncargo.seller_name}</p>
                      )}
                    </div>

                    {selectedEncargo.status === "PENDING" && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" onClick={() => setCheckoutEncargo(selectedEncargo)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                          <Check size={13} /> Cobrar
                        </Button>
                        <Button variant="outline" size="icon-sm" asChild>
                          <a href={`/admin/encargos/${selectedEncargo.id}`} target="_blank" rel="noopener noreferrer">
                            <Printer size={13} />
                          </a>
                        </Button>
                        <Button variant="outline" size="icon-sm" onClick={() => handleCancel(selectedEncargo)} disabled={isCancelling} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <X size={13} />
                        </Button>
                      </div>
                    )}
                    {selectedEncargo.status === "FULFILLED" && selectedEncargo.fulfilled_order_id && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/admin/orders/${selectedEncargo.fulfilled_order_id}`}>Ver Orden →</a>
                      </Button>
                    )}
                  </div>

                  {/* Client info */}
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Información del Cliente</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {selectedEncargo.customer_phone && (
                          <div><p className="text-xs text-muted-foreground">Teléfono</p><p className="font-medium">{selectedEncargo.customer_phone}</p></div>
                        )}
                        {selectedEncargo.school_name && (
                          <div><p className="text-xs text-muted-foreground">Escuela</p><p className="font-medium">{selectedEncargo.school_name}</p></div>
                        )}
                      </div>
                      {selectedEncargo.embroidery_notes && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-1">Notas</p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{selectedEncargo.embroidery_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Items */}
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Productos</p>
                      <div className="space-y-3">
                        {selectedEncargo.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm pb-3 border-b border-border last:border-0 last:pb-0">
                            <div>
                              <p className="font-medium text-foreground">{item.quantity}× {item.product_name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 font-mono">{item.size} · {item.color} · {item.sku}</p>
                              <p className="text-xs mt-0.5">
                                Existencia: <span className={item.current_stock === 0 ? "text-destructive font-semibold" : "text-emerald-600 font-semibold"}>{item.current_stock}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold font-mono">${(item.price * item.quantity).toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground font-mono">${item.price.toFixed(2)} c/u</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-3" />
                      <div className="flex justify-between font-semibold">
                        <span>Total Estimado</span>
                        <span className="font-mono">${selectedEncargo.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</span>
                      </div>
                      {selectedEncargo.deposit > 0 && (
                        <div className="flex justify-between text-sm text-emerald-600 mt-1">
                          <span>Anticipo pagado</span>
                          <span className="font-mono">−${selectedEncargo.deposit.toFixed(2)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {selectedEncargo.notes && (
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notas internas</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedEncargo.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <VariantModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={addToCart} />
      )}
      {checkoutEncargo && (
        <CheckoutModal
          encargo={checkoutEncargo}
          onClose={() => setCheckoutEncargo(null)}
          onConfirm={handleFulfill}
          isProcessing={isFulfilling}
        />
      )}
    </div>
  );
}
