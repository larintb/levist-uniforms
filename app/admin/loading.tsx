import React from 'react';

// --- Componente del Ícono del Logo con Animación ---
// Este es un logo genérico con una animación de pulso.
// Puede reemplazarlo con su propio componente de logo si lo desea.
const AnimatedLogo = () => (
    <div className="relative flex items-center justify-center h-20 w-20">
        {/* Anillo de pulso animado */}
        <div className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping"></div>
        {/* Logo estático en el centro */}
        <div className="relative inline-flex items-center justify-center rounded-full h-16 w-16 bg-indigo-600 text-white shadow-lg">
            <span className="text-2xl font-bold">L</span>
        </div>
    </div>
);


// --- Componente Principal de la Pantalla de Carga ---
// Next.js renderizará este componente automáticamente mientras las
// páginas dentro del directorio /admin estén cargando sus datos.
export default function AdminLoading() {
    return (
        // CAMBIO: Se usa 'flex-grow' para que el contenedor ocupe todo el espacio vertical disponible,
        // asegurando un centrado perfecto dentro del layout del admin.
        <div className="flex flex-grow flex-col items-center justify-center p-8">
            <div className="text-center">
                <AnimatedLogo />
                <h2 className="mt-6 text-xl font-semibold text-gray-700">
                    Cargando Módulo...
                </h2>
                <p className="mt-2 text-gray-500">
                    Por favor, espere un momento.
                </p>
            </div>
        </div>
    );
}
