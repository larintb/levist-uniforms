// @/app/admin/orders/[id]/work-order/page.tsx
"use client";

import { createClient } from '@/lib/supabase/client';
import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import Image from 'next/image';
import { Printer } from 'lucide-react';

type WorkOrderDetails = {
  order_id: string;
  order_date: string;
  customer_name: string | null;
  customer_phone: string | null;
  embroidery_notes: string | null;
  school_name?: string;
  seller_name: string | null;
  items: {
    item_id: string;
    product_name: string;
    sku: string;
    color: string;
    size: string;
    quantity: number;
    price_at_sale: number;
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
  .ticket-wrapper {
    width: 80mm !important;
    margin: 0 !important;
    padding: 0 !important;
  }
}
`;

const T = {
  container: { fontFamily: "Arial, Helvetica, sans-serif", fontSize: "9pt", color: "#000", background: "#fff", width: "80mm", margin: "0 auto" } as React.CSSProperties,
  center: { textAlign: "center" } as React.CSSProperties,
  bold: { fontWeight: 700 } as React.CSSProperties,
  small: { fontSize: "7.5pt" } as React.CSSProperties,
  row: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 } as React.CSSProperties,
  label: { fontSize: "7.5pt", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px", color: "#555" },
};

const Line = ({ dashed = true }: { dashed?: boolean }) => (
  <div style={{ borderTop: dashed ? "1px dashed #000" : "1px solid #000", margin: "3px 0" }} />
);

const LogoComponent = ({ size = 32 }: { size?: number }) => {
  const [err, setErr] = React.useState(false);
  if (err) return (
    <div style={{ width: size, height: size, background: "#1e293b", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 10 }}>LU</div>
  );
  return <Image src="/logo.jpg" alt="Levist" width={size} height={size} style={{ borderRadius: "50%", objectFit: "cover" }} onError={() => setErr(true)} />;
};

async function getWorkOrderDetails(orderId: string): Promise<WorkOrderDetails | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('full_order_details_view')
    .select('*')
    .eq('order_id', orderId);

  if (error || !data?.length) return null;

  const o = data[0];
  return {
    order_id: o.order_id,
    order_date: o.order_date,
    customer_name: o.customer_name,
    customer_phone: o.customer_phone,
    embroidery_notes: o.embroidery_notes,
    school_name: o.school_name,
    seller_name: o.seller_name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: data.map((r: any) => ({
      item_id: String(r.item_id ?? ''),
      product_name: String(r.product_name ?? ''),
      sku: String(r.sku ?? ''),
      color: String(r.color ?? ''),
      size: String(r.size ?? ''),
      quantity: Number(r.quantity ?? 0),
      price_at_sale: Number(r.price_at_sale ?? 0),
    })),
  };
}

function WorkOrderTicket({ details }: { details: WorkOrderDetails }) {
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

      {/* Meta */}
      <div style={{ marginBottom: 4 }}>
        <div style={T.row}><span style={T.bold}>No. Orden:</span><span style={{ ...T.bold, fontFamily: "monospace", fontSize: "10pt" }}>{details.order_id.slice(0, 8).toUpperCase()}</span></div>
        <div style={T.row}>
          <span style={T.bold}>Fecha:</span>
          <span style={T.small}>{new Date(details.order_date).toLocaleString("es-MX", { timeZone: "America/Matamoros", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        {details.seller_name && <div style={T.row}><span style={T.bold}>Vendedor:</span><span>{details.seller_name}</span></div>}
      </div>

      {/* Client */}
      <div style={{ border: "2px solid #000", padding: "4px 6px", marginBottom: 4 }}>
        <div style={{ ...T.label, ...T.center, marginBottom: 2 }}>Cliente</div>
        <div style={{ fontSize: "12pt", fontWeight: 900, textAlign: "center" }}>
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

      {/* Items */}
      <div style={{ ...T.label, marginBottom: 3 }}>Productos:</div>
      {details.items.map((item, i) => (
        <div key={item.item_id} style={{ marginBottom: 5, paddingBottom: 4, borderBottom: i < details.items.length - 1 ? "1px dotted #bbb" : "none" }}>
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

export default function WorkOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const [details, setDetails] = useState<WorkOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    params.then(({ id }) =>
      getWorkOrderDetails(id)
        .then((d) => { if (d) setDetails(d); else setError(true); })
        .catch(() => setError(true))
        .finally(() => setLoading(false))
    );
  }, [params]);

  useEffect(() => {
    if (!details) return;
    const auto = new URLSearchParams(window.location.search).get('autoprint') === 'true';
    if (auto) {
      const t = setTimeout(() => window.print(), 1200);
      return () => clearTimeout(t);
    }
  }, [details]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial, sans-serif" }}>
      <p style={{ color: "#64748b" }}>Cargando orden de trabajo…</p>
    </div>
  );

  if (error || !details) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
      <p style={{ color: "#dc2626" }}>No se pudo cargar la orden de trabajo</p>
      <button onClick={() => window.close()} style={{ background: "#64748b", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer" }}>Cerrar ventana</button>
    </div>
  );

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="no-print" style={{ textAlign: "center", padding: "16px 0 12px" }}>
        <button
          onClick={() => window.print()}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
        >
          <Printer size={16} />
          Imprimir Orden de Trabajo
        </button>
        <p style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>Se imprimirá automáticamente cuando se abra desde múltiples copias</p>
      </div>

      <WorkOrderTicket details={details} />
    </div>
  );
}
