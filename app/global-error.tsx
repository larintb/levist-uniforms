'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="es">
      <body className="antialiased">
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
          <div className="text-center space-y-4 max-w-sm">
            <div className="flex justify-center">
              <AlertTriangle className="h-12 w-12 text-zinc-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Algo salió mal</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Ocurrió un error inesperado en la aplicación.
              </p>
            </div>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
