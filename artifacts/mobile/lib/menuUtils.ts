import type { MenuItem } from "@/constants/data";
import { getApiBase } from "@/lib/apiBase";

export type ApiMenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  spicy: boolean;
  popular: boolean;
  calories: number | null;
  imageUrl: string | null;
  images?: string[];
  offerActive?: boolean;
  offerPercentage?: number | null;
  offerLabel?: string | null;
  offerStartDate?: string | null;
  offerEndDate?: string | null;
};

export function categoryNameToSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * Parse one or more image URLs from a stored imageUrl value.
 * Multiple images are stored as a JSON array string: '["url1","url2"]'
 * Single images are stored as a plain URL string.
 */
export function parseImageUrls(imageUrl: string | null | undefined): string[] {
  if (!imageUrl) return [];
  if (imageUrl.startsWith("[")) {
    try {
      const parsed = JSON.parse(imageUrl) as string[];
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}
  }
  return [imageUrl];
}

export function apiToMenuItem(item: ApiMenuItem): MenuItem {
  const rawUrls = parseImageUrls(item.imageUrl);
  const primaryUrl = rawUrls[0] ?? null;

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: categoryNameToSlug(item.category),
    popular: item.popular,
    spicy: item.spicy,
    calories: item.calories ?? undefined,
    imageUrl: primaryUrl,
    images: rawUrls.length > 1 ? rawUrls : (item.images ?? undefined),
    offerActive: item.offerActive,
    offerPercentage: item.offerPercentage ?? null,
    offerLabel: item.offerLabel ?? null,
    offerStartDate: item.offerStartDate ?? null,
    offerEndDate: item.offerEndDate ?? null,
  };
}

export function resolveMenuImageUrl(
  imageUrl: string | null | undefined,
): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  const base = getApiBase();
  return base ? `${base}${imageUrl}` : imageUrl;
}
