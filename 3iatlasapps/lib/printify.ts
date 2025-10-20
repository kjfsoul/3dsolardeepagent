const API = "https://api.printify.com/v1";
type Shop = { 
  id: number; 
  title: string; 
  sales_channel?: string;
};

type Product = {
  id: string; 
  title: string;
  description?: string;
  tags?: string[];
  images?: { 
    src: string; 
    variant_ids?: number[]; 
    position?: string; 
    is_default?: boolean;
  }[];
  visible?: boolean; 
  published?: boolean;
  created_at?: string; 
  updated_at?: string;
  variants?: {
    id: number;
    price: number;
  }[];
  external?: {
    id?: string;
    handle?: string;
  };
};
function auth() {
  const key = process.env.PRINTIFY_API_TOKEN;
  if (!key) return undefined;
  return { headers: { Authorization: `Bearer ${key}` }, next: { revalidate: 60 } };
}
export async function getShops(): Promise<Shop[]> {
  if (!auth()) return [];
  const res = await fetch(`${API}/shops.json`, auth());
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
// Map of store URLs to Printify shop titles
const SHOP_TITLE_MAP: Record<string, string> = {
  'https://3iatlas.printify.me': '3iAtlas',
  'https://mystic-arcana-pop-up.printify.me': 'Mystic Arcana Pop-up',
  'https://edm-shuffle-pop-up.printify.me': 'EDM Shuffle pop-up',
  'https://birthdaygen-popup.printify.me': 'BirthdayGen Popup',
};

export async function findShopIdByBase(base: string): Promise<number | null> {
  if (!base) return null;
  
  const shops = await getShops();
  const expectedTitle = SHOP_TITLE_MAP[base.toLowerCase().replace(/\/$/, '')];
  
  if (!expectedTitle) {
    console.warn('[Printify] No shop mapping for:', base);
    return null;
  }
  
  const match = shops.find(s => s.title === expectedTitle);
  return match ? match.id : null;
}
export async function getLatestPublishedProducts(shopId: number, limit = 3): Promise<Product[]> {
  if (!auth()) return [];
  const res = await fetch(`${API}/shops/${shopId}/products.json`, auth());
  if (!res.ok) return [];
  
  const response = await res.json();
  
  // Handle both array and object responses (Printify API returns object with 'data' property)
  const all = Array.isArray(response) ? response : (response.data || []);
  
  if (!Array.isArray(all)) {
    console.error('[Printify] Invalid product response format');
    return [];
  }
  
  const published = all
    .filter(p => p.published || p.visible)
    .sort((a, b) => new Date(b.updated_at ?? b.created_at ?? 0).getTime()
                   - new Date(a.updated_at ?? a.created_at ?? 0).getTime());
  
  return published.slice(0, limit);
}
export function toPublicProductUrl(storeBase: string, product: Product): string {
  // If external.handle is a full URL, use it directly
  if (product.external?.handle) {
    // Check if it's already a full URL
    if (product.external.handle.startsWith('http')) {
      return product.external.handle;
    }
    // Otherwise append to base
    const base = storeBase.replace(/\/$/, "");
    return `${base}${product.external.handle.startsWith('/') ? '' : '/'}${product.external.handle}`;
  }
  
  // Fallback: construct URL from base + product ID
  const base = storeBase.replace(/\/$/, "");
  if (product.external?.id) {
    return `${base}/product/${product.external.id}`;
  }
  return `${base}/product/${product.id}`;
}

export function productImage(p: Product): string {
  // Find default image or first image
  const defaultImg = p.images?.find(img => img.is_default);
  const firstImg = p.images?.[0];
  const imageUrl = defaultImg?.src || firstImg?.src || "/images/placeholder-product.png";
  
  // Log when we're using placeholder (for debugging)
  if (imageUrl === "/images/placeholder-product.png") {
    console.warn('[Printify] No image found for product:', p.title, 'ID:', p.id);
    if (p.images) {
      console.log('[Printify] Product has', p.images.length, 'images but none found');
    }
  }
  
  return imageUrl;
}

export function productPrice(p: Product): string {
  if (!p.variants || p.variants.length === 0) return "";
  const minPrice = Math.min(...p.variants.map(v => v.price));
  return `$${(minPrice / 100).toFixed(2)}`;
}

export function productDescription(p: Product): string {
  if (!p.description) return "";
  // Remove HTML tags if any
  const text = p.description.replace(/<[^>]*>/g, '');
  // Get first 2 sentences or 25 words
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const firstTwo = sentences.slice(0, 2).join(' ').trim();
  
  if (firstTwo) return firstTwo;
  
  // Fallback to 25 words if no sentences found
  const words = text.split(/\s+/).slice(0, 25).join(' ');
  return words + (text.split(/\s+/).length > 25 ? '...' : '');
}
