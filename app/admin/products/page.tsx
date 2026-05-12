import { ProductsList } from '@/components/admin/ProductsList';
import { PageHeader } from '@/components/admin/PageHeader';

export type ProductWithDetails = {
  id: string;
  name: string;
  sku_base: string;
  brand_name: string | null;
  collection_name: string | null;
};

export default function ProductsPage() {
  return (
    <div className="p-6">
      <PageHeader title="Productos" description="Gestiona el catálogo de productos de tu tienda." />
      <ProductsList />
    </div>
  );
}
