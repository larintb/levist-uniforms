import { Suspense } from 'react';
import { getSchools } from './actions';
import { SchoolsList } from '@/components/admin/SchoolsList';
import { PageHeader } from '@/components/admin/PageHeader';

export default async function SchoolsPage() {
  const schools = await getSchools();

  return (
    <div className="p-6">
      <PageHeader title="Escuelas" description="Gestiona las escuelas registradas en el sistema." />
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}>
        <SchoolsList initialSchools={schools} />
      </Suspense>
    </div>
  );
}
