import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <Card className="w-full max-w-sm shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-5xl font-bold text-zinc-300 dark:text-zinc-700 tabular-nums">404</p>
          <div>
            <h1 className="text-base font-semibold text-foreground">Página no encontrada</h1>
            <p className="text-sm text-muted-foreground mt-1">
              La página que buscas no existe o fue movida.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
