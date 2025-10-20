import ProductCarousel from "@/components/ProductCarousel";
import { findShopIdByBase, getLatestPublishedProducts } from "@/lib/printify";

export default async function FeaturedRow({ storeBase, title }: { storeBase: string; title?: string }) {
  const shopId = await findShopIdByBase(storeBase);
  // Fetch more products (12) to enable carousel navigation
  const prods = shopId ? await getLatestPublishedProducts(shopId, 12) : [];

  return (
    <>
      {title && <h4 className="mb-2 text-sm font-semibold text-white/80">{title}</h4>}
      <ProductCarousel products={prods} storeBase={storeBase} productsPerPage={3} />
    </>
  );
}
