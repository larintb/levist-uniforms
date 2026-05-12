'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[RootError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <Card className="w-full max-w-md shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <AlertTriangle className="h-10 w-10 text-zinc-400" />
          <div>
            <h1 className="text-base font-semibold text-foreground">Algo salió mal</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ocurrió un error inesperado. Puedes intentar recargar la página.
            </p>
          </div>
          <div className="flex gap-2 mt-1">
            <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Reintentar
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="gap-1.5 flex items-center">
                <Home className="h-3.5 w-3.5" />
                Inicio
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
