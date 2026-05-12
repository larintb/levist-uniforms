"use client";

import React from 'react';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import { MultiCopyPrintButton } from './MultiCopyPrintButton';
import { Printer } from 'lucide-react';

type OrderDetail = {
  order_id: string;
  order_date: string;
  order_total: number;
  subtotal: number;
  discount_amount: number;
  discount_reason: string | null;
  order_status: string;
  requires_invoice: boolean;
  payment_method: string | null;
  seller_name: string | null;
  customer_name: string | null;
  customer_phone?: string | null;
  embroidery_notes: string | null;
  school_name?: string;
  is_layaway: boolean;
  down_payment: number;
  remaining_balance: number;
  items: {
    item_id: string;
    product_name: string;
    sku: string;
    color: string;
    size: string;
    quantity: number;
    price_at_sale: number;
    delivered: boolean;
  }[];
};

const PRINT_CSS = `
@page {
  size: 80mm auto;
  margin: 2mm 3mm;
}
@media print {
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 80mm !important;
    background: #fff !important;
    color: #000 !important;
    font-size: 9pt !important;
    font-family: Arial, Helvetica, sans-serif !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .no-print { display: none !important; }
  .cut-line {
    page-break-after: always;
    break-after: page;
  }
  .ticket-wrapper {
    width: 80mm !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }
}
`;

const LogoComponent = ({ size = 32 }: { size?: number }) => {
  const [err, setErr] = React.useState(false);
  if (err) return (
    <div style={{ width: size, height: size, background: "#1e293b", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 10 }}>LU</div>
  );
  return <Image src="/logo.jpg" alt="Levist" width={size} height={size} style={{ borderRadius: "50%", objectFit: "cover" }} onError={() => setErr(true)} />;
};

const Line = ({ dashed = true }: { dashed?: boolean }) => (
  <div style={{ borderTop: dashed ? "1px dashed #000" : "1px solid #000", margin: "3px 0" }} />
);

// Shared style tokens
const T = {
  container: { fontFamily: "Arial, Helvetica, sans-serif", fontSize: "9pt", color: "#000", background: "#fff", width: "80mm", margin: "0 auto" } as React.CSSProperties,
  center: { textAlign: "center" } as React.CSSProperties,
  bold: { fontWeight: 700 } as React.CSSProperties,
  small: { fontSize: "7.5pt" } as React.CSSProperties,
  large: { fontSize: "12pt", fontWeight: 900 } as React.CSSProperties,
  header: { fontSize: "13pt", fontWeight: 900 } as React.CSSProperties,
  row: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 } as React.CSSProperties,
  label: { fontSize: "7.5pt", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px", color: "#555" },
};

// ─── Customer / Sale ticket ───────────────────────────────────
function CustomerTicket({
  title, details, subtotal, discountAmount, discountReason, iva, needsInvoice, isSpecialOrder,
}: {
  title: string; details: OrderDetail; subtotal: number;
  discountAmount: number; discountReason: string | null;
  iva: number; needsInvoice: boolean; isSpecialOrder: boolean;
}) {
  return (
    <div className="ticket-wrapper" style={T.container}>
      {/* Header */}
      <div style={{ ...T.center, paddingBottom: 4 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
          <LogoComponent size={36} />
        </div>
        <div style={T.header}>Levist Uniforms</div>
        <div style={{ ...T.small, marginTop: 2 }}>Matamoros, Tamaulipas</div>
        <div style={{ display: "inline-block", border: "2px solid #000", padding: "1px 8px", fontWeight: 900, fontSize: "9pt", letterSpacing: "1px", marginTop: 4 }}>{title}</div>
      </div>

      <Line />

      {/* Order info */}
      <div style={{ marginBottom: 4 }}>
        <div style={T.row}><span style={T.bold}>No. Orden:</span><span style={{ ...T.bold, fontFamily: "monospace" }}>{details.order_id.slice(0, 8).toUpperCase()}</span></div>
        <div style={T.row}>
          <span style={T.bold}>Fecha:</span>
          <span style={T.small}>{new Date(details.order_date).toLocaleString("es-MX", { timeZone: "America/Matamoros", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div style={T.row}><span style={T.bold}>Vendedor:</span><span>{details.seller_name || "N/A"}</span></div>
      </div>

      {/* Client */}
      <div style={{ border: "1.5px solid #000", padding: "3px 5px", marginBottom: 4 }}>
        <div style={{ ...T.label, ...T.center, marginBottom: 2 }}>Cliente</div>
        <div style={{ ...T.bold, fontSize: "10.5pt", textAlign: "center" }}>{details.customer_name || "Mostrador"}</div>
        {details.customer_phone && <div style={{ ...T.small, ...T.center }}>{details.customer_phone}</div>}
      </div>

      {/* Special order details */}
      {isSpecialOrder && (details.school_name || details.embroidery_notes) && (
        <div style={{ border: "1px dashed #000", padding: "3px 5px", marginBottom: 4 }}>
          <div style={{ ...T.label, ...T.center, marginBottom: 2 }}>Detalles del pedido</div>
          {details.school_name && <div style={{ ...T.row }}><span style={T.bold}>Escuela:</span><span>{details.school_name}</span></div>}
          {details.embroidery_notes && <div style={{ whiteSpace: "pre-wrap", fontSize: "8.5pt" }}>{details.embroidery_notes}</div>}
        </div>
      )}

      {/* Items */}
      <Line />
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ ...T.label, flex: 1 }}>Producto</span>
        <span style={{ ...T.label, width: 48, textAlign: "right" }}>Unit.</span>
        <span style={{ ...T.label, width: 52, textAlign: "right" }}>Total</span>
      </div>
      <Line />

      {details.items.map((item) => (
        <div key={item.item_id} style={{ marginBottom: 5 }}>
          <div style={{ display: "flex", gap: 4, alignItems: "baseline" }}>
            <span style={{ ...T.small, fontWeight: 700, minWidth: 16 }}>{item.delivered ? "[E]" : "[P]"}</span>
            <span style={{ ...T.bold, fontSize: "9pt", flex: 1 }}>{item.quantity}× {item.product_name}</span>
          </div>
          <div style={{ ...T.small, color: "#555", marginLeft: 20, marginTop: 1 }}>{item.size} &bull; {item.color}</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 1 }}>
            <span style={{ ...T.small, marginLeft: 20 }}>${item.price_at_sale.toFixed(2)} c/u</span>
            <span style={T.bold}>${(item.price_at_sale * item.quantity).toFixed(2)}</span>
          </div>
        </div>
      ))}

      <Line />

      {/* Totals */}
      <div style={{ marginTop: 3 }}>
        <div style={T.row}><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
        {discountAmount > 0 && (
          <div style={T.row}>
            <span>Descuento{discountReason ? ` (${discountReason})` : ""}:</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}
        {needsInvoice && iva > 0 && (
          <div style={T.row}><span>IVA (16%):</span><span>${iva.toFixed(2)}</span></div>
        )}
        <div style={{ ...T.row, ...T.large, borderTop: "1px solid #000", paddingTop: 3, marginTop: 2 }}>
          <span>TOTAL:</span>
          <span>${details.order_total.toFixed(2)}</span>
        </div>
        <div style={{ ...T.row, marginTop: 3 }}><span style={T.bold}>Método de pago:</span><span style={T.bold}>{details.payment_method || "N/A"}</span></div>

        {details.is_layaway && (
          <div style={{ border: "2px solid #000", padding: "4px 5px", marginTop: 5 }}>
            <div style={{ ...T.center, fontWeight: 900, fontSize: "10pt", letterSpacing: "1px", marginBottom: 4 }}>SEPARADO</div>
            <div style={T.row}><span style={T.bold}>Anticipo pagado:</span><span style={T.bold}>${details.down_payment.toFixed(2)}</span></div>
            <Line />
            <div style={{ ...T.row, ...T.large, fontSize: "11pt" }}>
              <span>Saldo pendiente:</span>
              <span>${details.remaining_balance.toFixed(2)}</span>
            </div>
            {details.remaining_balance > 0 && (
              <div style={{ ...T.center, fontSize: "8pt", fontWeight: 700, marginTop: 4, borderTop: "1px dashed #000", paddingTop: 4 }}>
                FAVOR DE COMPLETAR EL PAGO
              </div>
            )}
          </div>
        )}
      </div>

      <Line />

      {/* Footer */}
      <div style={{ ...T.center, paddingTop: 4 }}>
        <div style={{ ...T.small, color: "#555", marginBottom: 2 }}>[E] Entregado &nbsp;&bull;&nbsp; [P] Pendiente</div>
        <div style={{ ...T.bold, fontSize: "9.5pt", marginBottom: 6 }}>¡Gracias por su compra!</div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <QRCode value={details.order_id} size={120} style={{ height: "auto", width: 120 }} viewBox="0 0 256 256" />
        </div>
        <div style={{ ...T.small, marginTop: 3, fontFamily: "monospace" }}>{details.order_id.slice(0, 8).toUpperCase()}</div>
      </div>
    </div>
  );
}

// ─── Work order ticket ────────────────────────────────────────
function WorkOrderTicket({ details }: { details: OrderDetail }) {
  return (
    <div className="ticket-wrapper" style={T.container}>
      {/* Header */}
      <div style={{ ...T.center, paddingBottom: 4 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
          <LogoComponent size={32} />
        </div>
        <div style={{ fontSize: "12pt", fontWeight: 900 }}>Orden de Trabajo</div>
        <div style={{ fontWeight: 700, fontSize: "8.5pt", letterSpacing: "1px" }}>PRODUCCIÓN / TALLER</div>
      </div>

      <Line dashed={false} />

      {/* Order # */}
      <div style={{ ...T.row, marginBottom: 4 }}>
        <span style={T.bold}>No. Orden:</span>
        <span style={{ ...T.bold, fontFamily: "monospace", fontSize: "10pt" }}>{details.order_id.slice(0, 8).toUpperCase()}</span>
      </div>
      <div style={{ ...T.row, marginBottom: 4 }}>
        <span style={T.bold}>Fecha:</span>
        <span style={T.small}>{new Date(details.order_date).toLocaleString("es-MX", { timeZone: "America/Matamoros", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      {details.seller_name && <div style={{ ...T.row, marginBottom: 4 }}><span style={T.bold}>Vendedor:</span><span>{details.seller_name}</span></div>}

      {/* Client box */}
      <div style={{ border: "2px solid #000", padding: "4px 6px", marginBottom: 4 }}>
        <div style={{ ...T.label, ...T.center, marginBottom: 2 }}>Cliente</div>
        <div style={{ fontSize: "12pt", fontWeight: 900, textAlign: "center", textTransform: "uppercase" }}>
          {details.customer_name || "MOSTRADOR"}
        </div>
        {details.customer_phone && <div style={{ ...T.small, ...T.center, marginTop: 2 }}>{details.customer_phone}</div>}
      </div>

      {/* School */}
      {details.school_name && (
        <div style={{ border: "1.5px solid #000", padding: "3px 6px", marginBottom: 4 }}>
          <div style={{ ...T.label, ...T.center, marginBottom: 2 }}>Escuela</div>
          <div style={{ fontSize: "11pt", fontWeight: 900, textAlign: "center" }}>{details.school_name}</div>
        </div>
      )}

      {/* Instructions */}
      {details.embroidery_notes && (
        <div style={{ border: "1.5px dashed #000", padding: "4px 6px", marginBottom: 4 }}>
          <div style={{ ...T.label, marginBottom: 3 }}>Instrucciones / Notas:</div>
          <div style={{ whiteSpace: "pre-wrap", fontWeight: 700, fontSize: "9pt" }}>{details.embroidery_notes}</div>
        </div>
      )}

      <Line />

      {/* Items — no prices for work order */}
      <div style={{ ...T.label, marginBottom: 3 }}>Productos:</div>
      {details.items.map((item, i) => (
        <div key={item.item_id} style={{ marginBottom: 5, paddingBottom: 4, borderBottom: i < details.items.length - 1 ? "1px dotted #aaa" : "none" }}>
          <div style={{ fontWeight: 900, fontSize: "9.5pt" }}>{item.quantity}× {item.product_name}</div>
          <div style={{ ...T.small, color: "#444", marginTop: 1 }}>Talla: {item.size} &bull; Color: {item.color}</div>
          <div style={{ ...T.small, fontFamily: "monospace", marginTop: 1 }}>SKU: {item.sku}</div>
        </div>
      ))}

      <Line />

      {/* QR */}
      <div style={{ ...T.center, paddingTop: 4 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <QRCode value={details.order_id} size={120} style={{ height: "auto", width: 120 }} viewBox="0 0 256 256" />
        </div>
        <div style={{ ...T.small, marginTop: 3, fontFamily: "monospace" }}>{details.order_id.slice(0, 8).toUpperCase()}</div>
      </div>
    </div>
  );
}

// ─── Main Receipt export ──────────────────────────────────────
export function Receipt({ details }: { details: OrderDetail }) {
  const isSpecialOrder = !["COMPLETED", "DELIVERED"].includes(details.order_status);
  const needsInvoice = details.requires_invoice;

  const { subtotal, iva, discountAmount, discountReason } = React.useMemo(() => {
    const preDiscount = details.items.reduce((a, i) => a + i.price_at_sale * i.quantity, 0);
    const calcIva = needsInvoice ? (details.order_total - details.order_total / 1.16) : 0;
    return {
      subtotal: preDiscount,
      iva: calcIva,
      discountAmount: preDiscount + calcIva - details.order_total,
      discountReason: details.discount_reason,
    };
  }, [details, needsInvoice]);

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      {/* Screen controls */}
      <div className="no-print" style={{ textAlign: "center", padding: "16px 0 12px", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
        <button
          onClick={() => window.print()}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
        >
          <Printer size={16} />
          Imprimir Ticket
        </button>
        <div>
          <MultiCopyPrintButton
            orderId={details.order_id}
            orderHasEmbroidery={!!details.embroidery_notes}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors"
            buttonText="Imprimir Órdenes de Trabajo"
            showIcons={false}
          />
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Solo las órdenes de trabajo, sin ticket de venta</p>
        </div>
      </div>

      {/* Print area */}
      {isSpecialOrder ? (
        <>
          <CustomerTicket
            title="COPIA — CLIENTE"
            details={details}
            isSpecialOrder={isSpecialOrder}
            needsInvoice={needsInvoice}
            subtotal={subtotal}
            iva={iva}
            discountAmount={discountAmount}
            discountReason={discountReason}
          />
          <div className="cut-line" style={{ textAlign: "center", fontSize: "7.5pt", color: "#999", borderTop: "1.5px dashed #000", margin: "6px 0", padding: "2px 0" }}>
            — — — cortar — — —
          </div>
          <WorkOrderTicket details={details} />
        </>
      ) : (
        <CustomerTicket
          title="TICKET DE VENTA"
          details={details}
          isSpecialOrder={isSpecialOrder}
          needsInvoice={needsInvoice}
          subtotal={subtotal}
          iva={iva}
          discountAmount={discountAmount}
          discountReason={discountReason}
        />
      )}
    </div>
  );
}
