"use client";

import React from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { Encargo } from "@/app/admin/encargos/actions";
import { Printer } from "lucide-react";

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
  .ticket-wrapper {
    width: 80mm !important;
    padding: 0 !important;
    margin: 0 !important;
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

export function EncargoTicket({ encargo }: { encargo: Encargo }) {
  const subtotal = encargo.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = encargo.discount ?? 0;
  const total = Math.max(0, subtotal - discount);
  const remaining = total - encargo.deposit;

  const T = {
    container: { fontFamily: "Arial, Helvetica, sans-serif", fontSize: "9pt", color: "#000", background: "#fff", width: "80mm", margin: "0 auto" } as React.CSSProperties,
    center: { textAlign: "center" } as React.CSSProperties,
    bold: { fontWeight: 700 } as React.CSSProperties,
    xbold: { fontWeight: 900 } as React.CSSProperties,
    small: { fontSize: "7.5pt" } as React.CSSProperties,
    large: { fontSize: "12pt", fontWeight: 900 } as React.CSSProperties,
    header: { fontSize: "13pt", fontWeight: 900, letterSpacing: "0.5px" } as React.CSSProperties,
    badge: { display: "inline-block", border: "2px solid #000", padding: "1px 8px", fontWeight: 900, fontSize: "10pt", letterSpacing: "2px", marginTop: 4 } as React.CSSProperties,
    row: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 } as React.CSSProperties,
    label: { fontSize: "7.5pt", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px", color: "#444" },
  };

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      {/* Screen controls */}
      <div className="no-print" style={{ textAlign: "center", padding: "16px 0 12px" }}>
        <button
          onClick={() => window.print()}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
        >
          <Printer size={16} />
          Imprimir Ticket
        </button>
      </div>

      {/* Screen preview wrapper */}
      <div style={{ background: "#f1f5f9", padding: "12px 16px 24px", display: "flex", justifyContent: "center" }} className="no-print" />

      {/* The ticket — rendered for both screen preview and print */}
      <div className="ticket-wrapper" style={T.container}>

        {/* Header */}
        <div style={{ ...T.center, paddingBottom: 4 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
            <LogoComponent size={36} />
          </div>
          <div style={T.header}>Levist Uniforms</div>
          <div style={{ ...T.small, marginTop: 2 }}>Matamoros, Tamaulipas</div>
          <div style={T.badge}>ENCARGO</div>
        </div>

        <Line />

        {/* Order info */}
        <div style={{ marginBottom: 4 }}>
          <div style={T.row}><span style={T.bold}>No. Encargo:</span><span style={{ ...T.bold, fontFamily: "monospace" }}>{encargo.id.slice(0, 8).toUpperCase()}</span></div>
          <div style={T.row}>
            <span style={T.bold}>Fecha:</span>
            <span style={T.small}>{new Date(encargo.created_at).toLocaleString("es-MX", { timeZone: "America/Matamoros", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          {encargo.seller_name && <div style={T.row}><span style={T.bold}>Vendedor:</span><span>{encargo.seller_name}</span></div>}
        </div>

        {/* Client */}
        <div style={{ border: "1.5px solid #000", padding: "3px 5px", marginBottom: 4 }}>
          <div style={{ ...T.label, ...T.center, marginBottom: 2 }}>Cliente</div>
          <div style={{ ...T.bold, fontSize: "10.5pt", textAlign: "center" }}>{encargo.customer_name}</div>
          {encargo.customer_phone && <div style={{ ...T.small, ...T.center }}>{encargo.customer_phone}</div>}
          {encargo.school_name && <div style={{ ...T.small, ...T.center, marginTop: 2 }}>Escuela: <strong>{encargo.school_name}</strong></div>}
        </div>

        {/* Notes */}
        {encargo.embroidery_notes && (
          <div style={{ border: "1px dashed #000", padding: "3px 5px", marginBottom: 4 }}>
            <div style={T.label}>Notas / Bordado:</div>
            <div style={{ whiteSpace: "pre-wrap", fontSize: "8.5pt" }}>{encargo.embroidery_notes}</div>
          </div>
        )}

        {/* Items */}
        <Line />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <span style={{ ...T.label, flex: 1 }}>Producto</span>
          <span style={{ ...T.label, width: 44, textAlign: "right" }}>C/U</span>
          <span style={{ ...T.label, width: 52, textAlign: "right" }}>Total</span>
        </div>
        <Line />

        {encargo.items.map((item, i) => (
          <div key={i} style={{ marginBottom: 5 }}>
            <div style={{ ...T.bold, fontSize: "9pt" }}>{item.quantity}× {item.product_name}</div>
            <div style={{ ...T.small, color: "#444", marginTop: 1 }}>{item.size} &bull; {item.color}</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 1 }}>
              <span style={T.small}>${item.price.toFixed(2)}</span>
              <span style={T.bold}>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          </div>
        ))}

        <Line />

        {/* Totals */}
        <div style={{ marginTop: 3 }}>
          {discount > 0 && (
            <>
              <div style={T.row}><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
              <div style={T.row}>
                <span>Descuento{encargo.discount_reason ? ` (${encargo.discount_reason})` : ""}:</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            </>
          )}
          <div style={{ ...T.row, ...T.large, borderTop: "1px solid #000", paddingTop: 3, marginTop: 2 }}>
            <span>TOTAL:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          {encargo.deposit > 0 && (
            <>
              <div style={{ ...T.row, marginTop: 3 }}><span style={T.bold}>Anticipo pagado:</span><span style={T.bold}>-${encargo.deposit.toFixed(2)}</span></div>
              <Line />
              <div style={T.row}>
                <span style={T.bold}>Saldo pendiente:</span>
                <span style={{ ...T.large, fontSize: "11pt" }}>${remaining.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        <Line />

        {/* Footer */}
        <div style={{ ...T.center, paddingTop: 4 }}>
          <div style={{ ...T.small, fontStyle: "italic", marginBottom: 3 }}>Producto pendiente de llegada</div>
          <div style={{ ...T.bold, fontSize: "9.5pt", marginBottom: 6 }}>¡Gracias por su preferencia!</div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <QRCode value={encargo.id} size={120} style={{ height: "auto", width: 120 }} viewBox="0 0 256 256" />
          </div>
          <div style={{ ...T.small, marginTop: 3, fontFamily: "monospace" }}>{encargo.id.slice(0, 8).toUpperCase()}</div>
        </div>

      </div>
    </div>
  );
}
