// app/admin/layout.tsx
"use client"; // Convertimos el layout en un Componente de Cliente para manejar el estado

import { Sidebar } from '@/components/admin/Sidebar';
import React, { useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Estado para controlar si la barra lateral está colapsada
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Función para alternar el estado
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {/* Sidebar - La anchura ahora es dinámica y tiene una transición suave */}
      <div
        className={`shadow-lg z-10 transition-all duration-300 ease-in-out sticky top-0 h-screen ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Pasamos el estado y la función para alternarlo a la Sidebar */}
        <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      </div>

      {/* Main Content - Contenido principal de la página */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
