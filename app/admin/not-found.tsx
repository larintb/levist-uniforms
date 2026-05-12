import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-sm shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-5xl font-bold text-zinc-300 dark:text-zinc-700 tabular-nums">404</p>
          <div>
            <h2 className="text-base font-semibold text-foreground">Página no encontrada</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Esta sección no existe o fue movida.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/dashboard">Volver al dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
