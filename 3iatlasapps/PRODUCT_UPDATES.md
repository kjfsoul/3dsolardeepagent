# Product Update Guide

## ✅ All Products Are Fetched Live from Printify API

**No hardcoded values!** Your landing page automatically displays the latest products from your Printify shops.

## How It Works

### Automatic Updates
1. **Product Images**: Pulled directly from Printify's mockup images
2. **Product Titles**: Synced from your Printify product titles
3. **Prices**: Calculated from product variants (shows minimum price)
4. **Descriptions**: First 2 sentences or 25 words from your Printify product description
5. **Links**: Direct links to your Printify storefront product pages

### What Gets Displayed
- **Latest 3 products** from each shop (sorted by last updated)
- Only shows **published/visible** products
- Automatically refreshes every **60 seconds** (configurable in `lib/printify.ts`)

## How to Update Products on Your Landing Page

### Option 1: Update Existing Products
1. Go to your Printify dashboard
2. Edit the product (title, description, images, price)
3. Save changes
4. **Your landing page will update automatically within 60 seconds**

### Option 2: Add New Products
1. Create a new product in Printify
2. Publish it to your storefront
3. **The newest products automatically appear** (replaces oldest)

### Option 3: Remove Products
1. Unpublish or delete product in Printify
2. **Landing page will automatically show next available product**

## Troubleshooting Missing Images

If a product shows a placeholder image:

### Check in Printify:
1. Product has mockup images generated
2. Product is published to the storefront
3. Images are set as default

### The code automatically:
- Looks for `is_default` image first
- Falls back to first available image
- Uses placeholder if no images found

## Shop Mapping

Your landing page maps these URLs to Printify shops:

| Store URL | Shop Title in Printify |
|-----------|------------------------|
| `https://3iatlas.printify.me` | `3iAtlas` |
| `https://mystic-arcana-pop-up.printify.me` | `Mystic Arcana Pop-up` |
| `https://edm-shuffle-pop-up.printify.me` | `EDM Shuffle pop-up` |
| `https://birthdaygen-popup.printify.me` | `BirthdayGen Popup` |

**If you create a new shop**, add it to `SHOP_TITLE_MAP` in `lib/printify.ts`

## Cache Duration

Products are cached for **60 seconds** to reduce API calls. To change this:

```typescript
// In lib/printify.ts
return { 
  headers: { Authorization: `Bearer ${key}` }, 
  next: { revalidate: 60 }  // Change this number (seconds)
};
```

## API Rate Limits

Printify allows **600 requests per minute**. With 4 shops and 60-second cache:
- **4 API calls per minute** (well within limits)
- Safe for high traffic sites

## Summary

✅ **Zero maintenance required** - Just update products in Printify
✅ **No code changes needed** - All data is dynamic
✅ **Automatic refresh** - Latest products always shown
✅ **Fast performance** - Cached for 60 seconds
