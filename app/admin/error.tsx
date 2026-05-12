'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[AdminError]', error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-md shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <AlertTriangle className="h-9 w-9 text-zinc-400" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Algo salió mal</h2>
            <p className="text-sm text-muted-foreground mt-1">
              No se pudo cargar esta sección. Intenta de nuevo.
            </p>
          </div>
          <div className="flex gap-2 mt-1">
            <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Reintentar
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/dashboard" className="flex items-center gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
