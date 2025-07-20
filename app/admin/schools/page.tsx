import { Suspense } from 'react';
import { getSchools } from './actions';
import { SchoolsList } from '@/components/admin/SchoolsList';

export default async function SchoolsPage() {
  const schools = await getSchools();

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Escuelas</h1>
      </div>

      <Suspense fallback={<div>Cargando escuelas...</div>}>
        <SchoolsList initialSchools={schools} />
      </Suspense>
    </div>
  );
}
