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

// --- Types ---
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

// --- Icons ---
const TrashIcon = (p: React.SVGProps<SVGSVGElement>) => <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;
const SearchIcon = (p: React.SVGProps<SVGSVGElement>) => <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0Z" /></svg>;
const CheckIcon = (p: React.SVGProps<SVGSVGElement>) => <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>;
const XIcon = (p: React.SVGProps<SVGSVGElement>) => <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>;
const PrintIcon = (p: React.SVGProps<SVGSVGElement>) => <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6 18.25m10.56-4.421c.24.03.48.062.72.096m-.72-.096L18 18.25m-12 0h12M12 15V9" /></svg>;

// --- Status config ---
const statusConfig = {
    PENDING: { text: "Pendiente", color: "bg-amber-100 text-amber-800 ring-amber-500/30" },
    FULFILLED: { text: "Cobrado", color: "bg-emerald-100 text-emerald-800 ring-emerald-500/30" },
    CANCELLED: { text: "Cancelado", color: "bg-gray-100 text-gray-500 ring-gray-400/30" },
} as const;

const StatusBadge = ({ status }: { status: string }) => {
    const s = statusConfig[status as keyof typeof statusConfig] || { text: status, color: "bg-gray-100 text-gray-600 ring-gray-400/30" };
    return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ring-1 ring-inset ${s.color}`}>{s.text}</span>;
};

// --- Variant Selection Modal ---
const VariantModal = ({
    product,
    onClose,
    onAdd,
}: {
    product: GroupedProduct;
    onClose: () => void;
    onAdd: (item: CartItem) => void;
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{product.product_name}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">SKU: {product.sku_base}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Color</p>
                    <div className="flex flex-wrap gap-2">
                        {product.colors.map((c) => (
                            <button
                                key={c.color}
                                onClick={() => setSelectedColor(c)}
                                className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${selectedColor?.color === c.color ? "border-gray-800 ring-2 ring-gray-200" : "border-gray-200 hover:border-gray-400"}`}
                            >
                                <Image
                                    src={c.product_image || "/placeholder.jpg"}
                                    alt={c.color}
                                    width={64}
                                    height={64}
                                    className="w-14 h-14 object-cover rounded-lg"
                                />
                                <p className="text-xs font-medium mt-1.5 text-gray-700">{c.color}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {selectedColor && (
                    <div className="mb-6">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Talla</p>
                        <div className="flex flex-wrap gap-2">
                            {selectedColor.variants.map((v) => (
                                <button
                                    key={v.inventory_id}
                                    onClick={() => setSelectedVariant(v)}
                                    className={`relative px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
                                        selectedVariant?.inventory_id === v.inventory_id
                                            ? "border-gray-800 bg-gray-900 text-white"
                                            : "border-gray-200 text-gray-700 hover:border-gray-400"
                                    }`}
                                >
                                    {v.size}
                                    {v.stock === 0 && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                        {selectedVariant && (
                            <p className="text-xs text-gray-500 mt-2.5 flex gap-3">
                                <span>Precio: <strong className="text-gray-800">${selectedVariant.price.toFixed(2)}</strong></span>
                                <span>Existencia: <strong className={selectedVariant.stock === 0 ? "text-rose-600" : "text-emerald-600"}>{selectedVariant.stock}</strong></span>
                            </p>
                        )}
                    </div>
                )}

                <button
                    onClick={handleAdd}
                    disabled={!selectedVariant}
                    className="w-full py-3 font-bold text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    Agregar al Encargo
                </button>
            </div>
        </div>
    );
};

// --- Checkout Modal ---
const CheckoutModal = ({
    encargo,
    onClose,
    onConfirm,
    isProcessing,
}: {
    encargo: Encargo;
    onClose: () => void;
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Cobrar Encargo</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{encargo.customer_name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Items */}
                <div className="bg-gray-50 rounded-xl p-3 mb-4 max-h-36 overflow-y-auto">
                    {encargo.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-0.5">
                            <span className="text-gray-600">{item.quantity}× {item.product_name} <span className="text-gray-400">({item.size}/{item.color})</span></span>
                            <span className="font-semibold text-gray-800">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                {/* Amounts */}
                <div className="space-y-1.5 mb-5 border-t border-gray-100 pt-3">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal:</span>
                        <span className="font-semibold text-gray-800">${subtotal.toFixed(2)}</span>
                    </div>
                    {depositPaid > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Anticipo pagado:</span>
                            <span className="font-semibold text-emerald-700">−${depositPaid.toFixed(2)}</span>
                        </div>
                    )}

                    {/* Discount input */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descuento <span className="font-normal text-gray-400 normal-case">(opcional)</span></p>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center bg-white border border-gray-300 rounded-lg px-2 py-1.5 w-28">
                                <span className="text-xs text-gray-400 mr-1">$</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={subtotal}
                                    step={1}
                                    value={discountAmount}
                                    onChange={(e) => setDiscountAmount(Math.min(parseFloat(e.target.value) || 0, subtotal))}
                                    className="flex-1 text-sm font-semibold text-gray-800 bg-transparent outline-none w-0 min-w-0"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Razón del descuento..."
                                value={discountReason}
                                onChange={(e) => setDiscountReason(e.target.value)}
                                className="flex-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:border-gray-400 transition"
                            />
                        </div>
                        {discountAmount > 0 && (
                            <p className="text-xs text-emerald-700 font-semibold">−${discountAmount.toFixed(2)} aplicado</p>
                        )}
                    </div>

                    <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2 mt-1">
                        <span className="text-gray-900">Saldo a cobrar:</span>
                        <span className="text-gray-900">${pendingBalance.toFixed(2)}</span>
                    </div>
                </div>

                {/* Payment method */}
                <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Método de Pago</p>
                    <div className="flex gap-2">
                        {["Efectivo", "Tarjeta", "Transferencia"].map((m) => (
                            <button
                                key={m}
                                onClick={() => setPaymentMethod(m)}
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${paymentMethod === m ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Partial payment */}
                <label className="flex items-center gap-2.5 cursor-pointer mb-3">
                    <input
                        type="checkbox"
                        checked={isLayaway}
                        onChange={(e) => { setIsLayaway(e.target.checked); setAdditionalDeposit(0); }}
                        className="w-4 h-4 accent-gray-900 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">El cliente paga solo una parte ahora</span>
                </label>
                {isLayaway && (
                    <div className="bg-amber-50 rounded-xl p-3 mb-4">
                        <label className="text-xs text-gray-600 block mb-1.5">Pago adicional ahora</label>
                        <input
                            type="number"
                            min={0}
                            max={pendingBalance}
                            value={additionalDeposit}
                            onChange={(e) => setAdditionalDeposit(parseFloat(e.target.value) || 0)}
                            className="w-full p-2 border border-amber-200 rounded-lg text-sm text-gray-800 bg-white"
                        />
                        <p className="text-xs text-gray-500 mt-1.5">
                            Saldo pendiente: <strong className="text-amber-700">${finalRemaining.toFixed(2)}</strong>
                        </p>
                    </div>
                )}

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm({ paymentMethod, isLayaway, downPayment: finalDownPayment, discountAmount, discountReason })}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                    >
                        {isProcessing ? "Procesando..." : "Confirmar Cobro"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// Main Page
// ============================================================
export default function EncargosPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"nuevo" | "lista">("nuevo");

    // --- Nuevo Encargo State ---
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

    // --- Lista State ---
    const [encargos, setEncargos] = useState<Encargo[]>([]);
    const [statusFilter, setStatusFilter] = useState("PENDING");
    const [searchClient, setSearchClient] = useState("");
    const [selectedEncargo, setSelectedEncargo] = useState<Encargo | null>(null);
    const [checkoutEncargo, setCheckoutEncargo] = useState<Encargo | null>(null);
    const [isLoadingList, startLoadingList] = useTransition();
    const [isFulfilling, startFulfilling] = useTransition();
    const [isCancelling, startCancelling] = useTransition();

    // Load schools once
    useEffect(() => {
        getSchools().then(setSchools as (s: { id: string; name: string }[]) => void);
    }, []);

    // Debounced search using browser Supabase client (same pattern as ProductsList)
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!searchQuery.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        debounceRef.current = setTimeout(async () => {
            const term = `%${searchQuery.trim()}%`;
            const { data, error } = await supabase
                .from("full_inventory_details")
                .select("inventory_id, product_name, sku, color, size, stock, price, barcode, product_image")
                .or(`product_name.ilike.${term},sku.ilike.${term}`)
                .order("product_name", { ascending: true })
                .order("size", { ascending: true });

            if (error) {
                console.error("Search error:", error);
                setIsSearching(false);
                return;
            }

            // Group by sku → colors → variants
            const productMap = new Map<string, GroupedProduct>();
            for (const item of data || []) {
                if (!productMap.has(item.sku)) {
                    productMap.set(item.sku, { sku_base: item.sku, product_name: item.product_name, colors: [] });
                }
                const gp = productMap.get(item.sku)!;
                let cv = gp.colors.find((c) => c.color === item.color);
                if (!cv) {
                    cv = { color: item.color, product_image: item.product_image, variants: [] };
                    gp.colors.push(cv);
                }
                cv.variants.push({ inventory_id: item.inventory_id, size: item.size, stock: item.stock, price: item.price, barcode: item.barcode });
            }

            setSearchResults(Array.from(productMap.values()).slice(0, 10));
            setIsSearching(false);
        }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    // Close results on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Load encargos when tab or filter changes
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


    // --- Cart Operations ---
    const addToCart = (item: CartItem) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.inventory_id === item.inventory_id);
            if (existing) return prev.map((i) => i.inventory_id === item.inventory_id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, item];
        });
        setSelectedProduct(null);
        setSearchQuery("");
        setShowResults(false);
    };

    const removeFromCart = (inventory_id: string) =>
        setCart((prev) => prev.filter((i) => i.inventory_id !== inventory_id));

    const updateCartPrice = (inventory_id: string, price: number) =>
        setCart((prev) => prev.map((i) => (i.inventory_id === inventory_id ? { ...i, price } : i)));

    const updateCartQty = (inventory_id: string, quantity: number) => {
        if (quantity < 1) return;
        setCart((prev) => prev.map((i) => (i.inventory_id === inventory_id ? { ...i, quantity } : i)));
    };

    const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const cartTotal = Math.max(0, cartSubtotal - discount);

    // --- Create Encargo ---
    const handleCreateEncargo = () => {
        if (!customerName.trim()) { toast.error("El nombre del cliente es requerido"); return; }
        if (cart.length === 0) { toast.error("Agrega al menos un producto"); return; }

        startCreating(async () => {
            const payload: CreateEncargoPayload = {
                customerName: customerName.trim(),
                customerPhone: customerPhone.trim(),
                schoolId,
                embroideryNotes: embroideryNotes.trim(),
                notes: "",
                deposit,
                discount,
                discountReason: discountReason.trim(),
                items: cart.map((i) => ({ inventory_id: i.inventory_id, quantity: i.quantity, price: i.price })),
            };

            const result = await createEncargoAction(payload);
            if (result.success && result.encargoId) {
                toast.success("Encargo creado");
                setCart([]);
                setCustomerName("");
                setCustomerPhone("");
                setSchoolId(null);
                setEmbroideryNotes("");
                setDeposit(0);
                setDiscount(0);
                setDiscountReason("");
                setSearchQuery("");
                router.push(`/admin/encargos/${result.encargoId}`);
            } else {
                toast.error(result.message || "Error al crear encargo");
            }
        });
    };

    // --- Fulfill ---
    const handleFulfill = ({ paymentMethod, isLayaway, downPayment, discountAmount, discountReason }: { paymentMethod: string; isLayaway: boolean; downPayment: number; discountAmount: number; discountReason: string }) => {
        if (!checkoutEncargo) return;
        const subtotal = checkoutEncargo.items.reduce((s, i) => s + i.price * i.quantity, 0);
        const total = Math.max(0, subtotal - discountAmount);
        const remaining = isLayaway ? total - downPayment : 0;

        startFulfilling(async () => {
            const result = await fulfillEncargoAction({
                encargoId: checkoutEncargo.id,
                paymentMethod,
                total,
                subtotal,
                discountAmount,
                discountReason,
                isLayaway,
                downPayment,
                remainingBalance: remaining,
            });

            if (result.success && result.orderId) {
                toast.success("Encargo cobrado — orden creada");
                setCheckoutEncargo(null);
                loadEncargos();
                router.push(`/admin/orders/${result.orderId}`);
            } else {
                toast.error(result.message || "Error al cobrar encargo");
            }
        });
    };

    // --- Cancel ---
    const handleCancel = (encargo: Encargo) => {
        if (!confirm(`¿Cancelar el encargo de ${encargo.customer_name}?`)) return;
        startCancelling(async () => {
            const result = await cancelEncargoAction(encargo.id);
            if (result.success) {
                toast.success("Encargo cancelado");
                loadEncargos();
                if (selectedEncargo?.id === encargo.id) setSelectedEncargo(null);
            } else {
                toast.error(result.message || "Error al cancelar");
            }
        });
    };

    // --- Filtered list ---
    const filteredEncargos = encargos.filter((e) => {
        if (!searchClient.trim()) return true;
        const q = searchClient.toLowerCase();
        return e.customer_name.toLowerCase().includes(q) || (e.customer_phone || "").includes(q) || e.id.slice(0, 8).includes(q);
    });

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Encargos</h1>
                        <p className="text-sm text-gray-500">Pedidos de productos sin existencia</p>
                    </div>
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab("nuevo")}
                            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === "nuevo" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Nuevo Encargo
                        </button>
                        <button
                            onClick={() => setActiveTab("lista")}
                            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === "lista" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
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
                            <div className="max-w-2xl mx-auto space-y-6">

                                {/* Product Search */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Agregar producto</label>
                                    <div className="relative" ref={searchRef}>
                                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder="Buscar por SKU o nombre..."
                                            value={searchQuery}
                                            onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
                                            onFocus={() => setShowResults(true)}
                                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 shadow-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition"
                                        />

                                        {/* Dropdown results */}
                                        {showResults && searchQuery.trim().length >= 1 && (
                                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                                                {isSearching ? (
                                                    <p className="text-sm text-gray-400 text-center py-4">Buscando...</p>
                                                ) : searchResults.length === 0 ? (
                                                    <p className="text-sm text-gray-400 text-center py-4">Sin resultados para &quot;{searchQuery}&quot;</p>
                                                ) : (
                                                    <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                                                        {searchResults.map((p) => (
                                                            <li key={p.sku_base}>
                                                                <button
                                                                    onClick={() => { setShowResults(false); setSelectedProduct(p); }}
                                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                                                >
                                                                    <Image
                                                                        src={p.colors[0]?.product_image || "/placeholder.jpg"}
                                                                        alt={p.product_name}
                                                                        width={40}
                                                                        height={40}
                                                                        className="w-10 h-10 object-cover rounded-lg bg-gray-100 flex-shrink-0"
                                                                    />
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-sm font-semibold text-gray-900 truncate">{p.product_name}</p>
                                                                        <p className="text-xs text-gray-400">{p.sku_base} · {p.colors.length} color{p.colors.length !== 1 ? "es" : ""}</p>
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
                                {cart.length > 0 && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-2">Productos del encargo</p>
                                        <div className="space-y-2">
                                            {cart.map((item) => (
                                                <div key={item.inventory_id} className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm">
                                                    <div className="flex items-start justify-between gap-2 mb-2.5">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold text-gray-900 truncate">{item.product_name}</p>
                                                            <p className="text-xs text-gray-400 mt-0.5">{item.size} · {item.color} · {item.sku}</p>
                                                        </div>
                                                        <button onClick={() => removeFromCart(item.inventory_id)} className="text-gray-300 hover:text-rose-500 transition-colors mt-0.5">
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {/* Qty */}
                                                        <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                                                            <button onClick={() => updateCartQty(item.inventory_id, item.quantity - 1)} className="px-3 py-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 font-bold text-sm transition-colors">−</button>
                                                            <span className="text-sm font-bold text-gray-800 w-7 text-center">{item.quantity}</span>
                                                            <button onClick={() => updateCartQty(item.inventory_id, item.quantity + 1)} className="px-3 py-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 font-bold text-sm transition-colors">+</button>
                                                        </div>
                                                        {/* Price */}
                                                        <div className="flex items-center gap-1 flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5">
                                                            <span className="text-xs text-gray-400 font-medium">$</span>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                step={1}
                                                                value={item.price}
                                                                onChange={(e) => updateCartPrice(item.inventory_id, parseFloat(e.target.value) || 0)}
                                                                className="flex-1 text-sm font-semibold text-gray-800 bg-transparent text-right outline-none w-0 min-w-0"
                                                            />
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-700 flex-shrink-0">
                                                            = ${(item.price * item.quantity).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {discount > 0 && (
                                                <div className="flex justify-between items-center px-1 pt-1 text-sm text-gray-400">
                                                    <span>Subtotal</span>
                                                    <span>${cartSubtotal.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {discount > 0 && (
                                                <div className="flex justify-between items-center px-1 text-sm text-emerald-600">
                                                    <span>Descuento</span>
                                                    <span>−${discount.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center px-1 pt-1 border-t border-gray-100">
                                                <span className="text-sm text-gray-500">Total estimado</span>
                                                <span className="text-base font-bold text-gray-900">${cartTotal.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {cart.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-10 text-gray-300 border-2 border-dashed border-gray-200 rounded-2xl">
                                        <SearchIcon className="h-8 w-8 mb-2" />
                                        <p className="text-sm">Busca y agrega productos al encargo</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Customer Form */}
                    <div className="w-80 xl:w-96 flex flex-col bg-white border-l border-gray-200 overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Datos del Cliente</p>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Nombre <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Nombre completo"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Teléfono</label>
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder="868-123-4567"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Escuela</label>
                                <select
                                    value={schoolId ?? ""}
                                    onChange={(e) => setSchoolId(e.target.value || null)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 focus:bg-white focus:border-gray-400 outline-none transition"
                                >
                                    <option value="">Ninguna</option>
                                    {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Notas de bordado / pedido <span className="font-normal text-gray-400">(opcional)</span></label>
                                <textarea
                                    rows={3}
                                    value={embroideryNotes}
                                    onChange={(e) => setEmbroideryNotes(e.target.value)}
                                    placeholder="Ej. Bordar nombre en cuello..."
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10 outline-none transition resize-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Anticipo / Depósito <span className="font-normal text-gray-400">(opcional)</span></label>
                                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-900/10 transition">
                                    <span className="text-sm text-gray-400 mr-1.5">$</span>
                                    <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={deposit}
                                        onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)}
                                        className="flex-1 text-sm text-gray-800 bg-transparent outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Descuento <span className="font-normal text-gray-400">(opcional)</span></label>
                                <div className="flex gap-2">
                                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-900/10 transition w-28">
                                        <span className="text-sm text-gray-400 mr-1.5">$</span>
                                        <input
                                            type="number"
                                            min={0}
                                            step={1}
                                            value={discount}
                                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                            className="flex-1 text-sm text-gray-800 bg-transparent outline-none w-0 min-w-0"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Razón..."
                                        value={discountReason}
                                        onChange={(e) => setDiscountReason(e.target.value)}
                                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 focus:bg-white focus:border-gray-400 outline-none transition"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100">
                            <button
                                onClick={handleCreateEncargo}
                                disabled={isCreating || cart.length === 0 || !customerName.trim()}
                                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {isCreating ? "Creando..." : "Crear Encargo"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* TAB: LISTA DE ENCARGOS */}
            {/* ============================================================ */}
            {activeTab === "lista" && (
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md mx-4 mt-4">
                        <div className="flex gap-3">
                            <svg className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-blue-800">Aviso sobre el control de inventario</p>
                                <p className="text-sm text-blue-700 mt-0.5">Recuerda registrar la entrada física de mercancía en el inventario <strong>antes</strong> de procesar y &quot;Cobrar&quot; un encargo. Intentar cumplir un encargo sin stock disponible marcará un error en el sistema.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-1 overflow-hidden mt-4">
                        {/* Left: List */}
                        <div className="w-80 xl:w-96 flex flex-col border-r border-gray-200 bg-white overflow-hidden">
                            <div className="p-3 border-b border-gray-200 space-y-2">
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente..."
                                        value={searchClient}
                                        onChange={(e) => setSearchClient(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50 focus:bg-white focus:border-gray-400 outline-none transition"
                                    />
                                </div>
                                <div className="flex gap-1">
                                    {["PENDING", "FULFILLED", "CANCELLED", "ALL"].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => { setStatusFilter(s); setSelectedEncargo(null); }}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                                        >
                                            {s === "PENDING" ? "Pendientes" : s === "FULFILLED" ? "Cobrados" : s === "CANCELLED" ? "Cancelados" : "Todos"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                                {isLoadingList ? (
                                    <p className="text-center text-gray-400 text-sm py-8">Cargando...</p>
                                ) : filteredEncargos.length === 0 ? (
                                    <p className="text-center text-gray-400 text-sm py-8">Sin encargos</p>
                                ) : (
                                    filteredEncargos.map((enc) => (
                                        <button
                                            key={enc.id}
                                            onClick={() => setSelectedEncargo(enc)}
                                            className={`w-full text-left p-3.5 hover:bg-gray-50 transition-colors ${selectedEncargo?.id === enc.id ? "bg-gray-50 border-l-4 border-gray-900" : "border-l-4 border-transparent"}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{enc.customer_name}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {enc.items.length} producto{enc.items.length !== 1 ? "s" : ""}
                                                        {enc.customer_phone && ` · ${enc.customer_phone}`}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(enc.created_at).toLocaleDateString("es-MX")} · #{enc.id.slice(0, 8)}
                                                    </p>
                                                </div>
                                                <StatusBadge status={enc.status} />
                                            </div>
                                            <p className="text-xs font-semibold text-gray-700 mt-1.5">
                                                ${enc.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}
                                                {enc.deposit > 0 && <span className="text-emerald-600 font-normal ml-1.5">(anticipo ${enc.deposit.toFixed(2)})</span>}
                                            </p>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right: Detail */}
                        <div className="flex-1 overflow-y-auto bg-gray-50">
                            {!selectedEncargo ? (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <p className="text-sm">Selecciona un encargo</p>
                                </div>
                            ) : (
                                <div className="p-6 max-w-2xl space-y-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h2 className="text-xl font-bold text-gray-900">{selectedEncargo.customer_name}</h2>
                                                <StatusBadge status={selectedEncargo.status} />
                                            </div>
                                            <p className="text-sm text-gray-400">
                                                #{selectedEncargo.id.slice(0, 8)} · {new Date(selectedEncargo.created_at).toLocaleString("es-MX", { timeZone: "America/Matamoros", dateStyle: "medium", timeStyle: "short" })}
                                            </p>
                                            {selectedEncargo.seller_name && (
                                                <p className="text-xs text-gray-400 mt-0.5">Vendedor: {selectedEncargo.seller_name}</p>
                                            )}
                                        </div>

                                        {selectedEncargo.status === "PENDING" && (
                                            <div className="flex gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => setCheckoutEncargo(selectedEncargo)}
                                                    className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
                                                >
                                                    <CheckIcon className="h-4 w-4" />
                                                    Cobrar
                                                </button>
                                                <a
                                                    href={`/admin/encargos/${selectedEncargo.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                                                >
                                                    <PrintIcon className="h-4 w-4" />
                                                </a>
                                                <button
                                                    onClick={() => handleCancel(selectedEncargo)}
                                                    disabled={isCancelling}
                                                    className="flex items-center gap-1.5 bg-white border border-gray-200 text-rose-500 px-3 py-2 rounded-lg text-sm hover:bg-rose-50 hover:border-rose-200 transition-colors disabled:opacity-50"
                                                >
                                                    <XIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                        {selectedEncargo.status === "FULFILLED" && selectedEncargo.fulfilled_order_id && (
                                            <a
                                                href={`/admin/orders/${selectedEncargo.fulfilled_order_id}`}
                                                className="text-sm font-semibold text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                Ver Orden →
                                            </a>
                                        )}
                                    </div>

                                    {/* Client info */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Información del Cliente</p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                            {selectedEncargo.customer_phone && (
                                                <div><span className="text-gray-400 text-xs">Teléfono</span><p className="font-medium text-gray-800">{selectedEncargo.customer_phone}</p></div>
                                            )}
                                            {selectedEncargo.school_name && (
                                                <div><span className="text-gray-400 text-xs">Escuela</span><p className="font-medium text-gray-800">{selectedEncargo.school_name}</p></div>
                                            )}
                                        </div>
                                        {selectedEncargo.embroidery_notes && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <p className="text-xs text-gray-400 mb-1">Notas</p>
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedEncargo.embroidery_notes}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Items */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Productos</p>
                                        <div className="space-y-3">
                                            {selectedEncargo.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-sm pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{item.quantity}× {item.product_name}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{item.size} · {item.color} · {item.sku}</p>
                                                        <p className="text-xs mt-0.5">
                                                            Existencia: <span className={item.current_stock === 0 ? "text-rose-600 font-semibold" : "text-emerald-600 font-semibold"}>{item.current_stock}</span>
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                                                        <p className="text-xs text-gray-400">${item.price.toFixed(2)} c/u</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border-t border-gray-200 mt-3 pt-3 space-y-1">
                                            <div className="flex justify-between font-bold text-gray-900">
                                                <span>Total Estimado</span>
                                                <span>${selectedEncargo.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</span>
                                            </div>
                                            {selectedEncargo.deposit > 0 && (
                                                <div className="flex justify-between text-sm text-emerald-700">
                                                    <span>Anticipo pagado</span>
                                                    <span className="font-semibold">−${selectedEncargo.deposit.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {selectedEncargo.notes && (
                                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notas internas</p>
                                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedEncargo.notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {selectedProduct && (
                <VariantModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    onAdd={addToCart}
                />
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
