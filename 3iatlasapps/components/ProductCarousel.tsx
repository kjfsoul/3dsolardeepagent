"use client";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { useState } from "react";

type Product = {
  id: string;
  title: string;
  description?: string;
  images?: { src: string; is_default?: boolean }[];
  variants?: { id: number; price: number }[];
  external?: { id?: string; handle?: string };
};

type Props = {
  products: Product[];
  storeBase: string;
  productsPerPage?: number;
};

export default function ProductCarousel({ products, storeBase, productsPerPage = 3 }: Props) {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(products.length / productsPerPage);
  
  const startIdx = currentPage * productsPerPage;
  const currentProducts = products.slice(startIdx, startIdx + productsPerPage);
  
  // Pad with nulls if we have fewer than productsPerPage
  const displayProducts = [...currentProducts, ...Array(productsPerPage - currentProducts.length).fill(null)];

  const nextPage = () => setCurrentPage((prev) => (prev + 1) % totalPages);
  const prevPage = () => setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  
  const getProductUrl = (p: Product) => {
    if (p.external?.handle?.startsWith('http')) {
      return p.external.handle;
    }
    const base = storeBase.replace(/\/$/, "");
    if (p.external?.handle) {
      return `${base}${p.external.handle.startsWith('/') ? '' : '/'}${p.external.handle}`;
    }
    if (p.external?.id) {
      return `${base}/product/${p.external.id}`;
    }
    return `${base}/product/${p.id}`;
  };

  const getProductImage = (p: Product) => {
    const defaultImg = p.images?.find(img => img.is_default);
    const firstImg = p.images?.[0];
    return defaultImg?.src || firstImg?.src || "/images/placeholder-product.png";
  };

  const getProductPrice = (p: Product) => {
    if (!p.variants || p.variants.length === 0) return "";
    const minPrice = Math.min(...p.variants.map(v => v.price));
    return `$${(minPrice / 100).toFixed(2)}`;
  };

  const getProductDescription = (p: Product) => {
    if (!p.description) return "";
    const text = p.description.replace(/<[^>]*>/g, '');
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const firstTwo = sentences.slice(0, 2).join(' ').trim();
    if (firstTwo) return firstTwo;
    const words = text.split(/\s+/).slice(0, 25).join(' ');
    return words + (text.split(/\s+/).length > 25 ? '...' : '');
  };

  return (
    <section className="mt-4">
      <div className="relative">
        {/* Left Navigation Arrow */}
        {products.length > productsPerPage && (
          <button
            onClick={prevPage}
            aria-label="Previous products"
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 p-3 hover:bg-white shadow-lg transition-all hover:scale-110"
          >
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {displayProducts.map((p, i) => {
            // Use a unique key that includes currentPage to force re-render
            const uniqueKey = `${currentPage}-${i}-${p?.id || 'placeholder'}`;
            const url = p ? getProductUrl(p) : (storeBase || "#");
            const img = p ? getProductImage(p) : "/images/placeholder-product.png";
            const name = p?.title ?? "Product coming soon";
            const price = p ? getProductPrice(p) : "";
            const description = p ? getProductDescription(p) : "";
            
            return (
              <Link key={uniqueKey} href={url} target="_blank" rel="noopener" aria-label={`Open ${name} in new tab`}
                className="group block rounded-xl border border-white/10 bg-white/5 p-3 hover:border-white/20 transition-all">
                <div className="relative h-56 w-full overflow-hidden rounded-lg bg-white flex items-center justify-center">
                  <SafeImage
                    src={img}
                    alt={name}
                    className="object-contain transition-transform duration-300 group-hover:scale-[1.05] max-h-full"
                  />
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="text-sm font-semibold text-white/90 line-clamp-2 flex-1">{name}</h5>
                    {price && <span className="text-sm font-bold text-green-400 whitespace-nowrap">{price}</span>}
                  </div>
                  {description && (
                    <p className="text-xs text-white/60 line-clamp-2">{description}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        
        {/* Right Navigation Arrow */}
        {products.length > productsPerPage && (
          <button
            onClick={nextPage}
            aria-label="Next products"
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 p-3 hover:bg-white shadow-lg transition-all hover:scale-110"
          >
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        
        {/* Page Indicator */}
        {products.length > productsPerPage && (
          <div className="mt-3 flex justify-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                aria-label={`Go to page ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === currentPage ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
