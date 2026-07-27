import { useState, useEffect, useMemo } from "react";
import { useSearch } from "wouter";
import { customFetch } from "@workspace/api-client-react";
import { FoodCard } from "@/components/FoodCard";
import { ItemModal } from "@/components/ItemModal";
import { Skeleton, MenuCardSkeleton } from "@/components/Skeleton";
import { Search } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  description?: string;
  isAvailable?: boolean;
  offerPercentage?: number;
  offerActive?: boolean;
  hasSizes?: boolean;
  priceSmall?: number;
  priceMedium?: number;
  priceLarge?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji?: string;
}

export default function Menu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const qs = useSearch();
  const params = new URLSearchParams(qs);
  const initialCat = params.get("cat") || "All";
  const [activeCategory, setActiveCategory] = useState(initialCat);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    const cat = params.get("cat");
    if (cat && cat !== activeCategory) {
      setActiveCategory(cat);
    }
  }, [qs]);

  useEffect(() => {
    Promise.all([
      customFetch<MenuItem[]>("/api/mobile/menu"),
      customFetch<Category[]>("/api/mobile/categories"),
      customFetch<Record<string, any>>("/api/mobile/settings"),
    ])
      .then(([menuData, catData, settingsData]) => {
        setItems(menuData.filter((i) => i.isAvailable !== false));
        setCategories(catData);
        setSettings(settingsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categoryNames = ["All", ...categories.map((c) => c.name)];

  const filtered = items.filter((item) => {
    if (activeCategory !== "All" && item.category.toLowerCase() !== activeCategory.toLowerCase()) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const groupedByCategory = useMemo(() => {
    if (activeCategory !== "All" || search) return null;
    const groups: Record<string, MenuItem[]> = {};
    for (const cat of categories) {
      const catItems = filtered.filter((i) => i.category.toLowerCase() === cat.name.toLowerCase());
      if (catItems.length > 0) groups[cat.name] = catItems;
    }
    return groups;
  }, [activeCategory, search, filtered, categories]);

  const getCategoryEmoji = (catName: string) => {
    const cat = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
    return cat?.emoji || "";
  };

  const RECOMMENDED_IDS = (settings as any).recommendedItemIds || ["m7", "m8", "m9", "m10"];
  const recommended = items
    .filter((i) => RECOMMENDED_IDS.includes(i.id))
    .sort((a, b) => RECOMMENDED_IDS.indexOf(a.id) - RECOMMENDED_IDS.indexOf(b.id));

  if (loading) {
    return (
      <div className="menu-bg">
        <div className="menu-border-pattern" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-full mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <MenuCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-bg">
      <div className="menu-border-pattern" />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="text-center mb-8">
            <h1 className="text-5xl md:text-7xl font-extrabold text-gold font-serif tracking-tight leading-tight">
              Our Menu
            </h1>
            <p className="text-off-white-dim text-base md:text-lg mt-2 font-sans font-light">
              Handcrafted dishes, <span className="text-[#C8102E] font-semibold">bold flavors</span>, halal-certified
            </p>
            <p className="font-['Caveat'] text-2xl md:text-3xl text-[#CBD5E1] mt-2">
              every bite tells a story
            </p>
        </div>
        <div className="max-w-md mx-auto mb-8">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-jet-muted" />
              <input
                id="menu-search"
                name="search"
                type="text"
                placeholder="Search menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-jet border border-gray-200 text-sm focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30 transition-all placeholder:text-jet-muted"
              />
            </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
          {categoryNames.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-crimson text-white shadow-lg shadow-crimson-glow"
                  : "bg-white text-jet-light border border-gray-200 hover:border-crimson/50 hover:text-crimson"
              }
              }`}
            >
              {cat !== "All" && getCategoryEmoji(cat) ? `${getCategoryEmoji(cat)} ` : ""}{cat}
              {cat !== "All" && (
                <span className="ml-1.5 text-xs opacity-60">
                  ({items.filter((i) => i.category.toLowerCase() === cat.toLowerCase()).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-medium text-off-white-dim font-['Caveat'] tracking-wide">
              nothing catches your eye?
            </p>
            <p className="text-sm text-jet-muted mt-1 font-sans">
              Try a different category or search term
            </p>
          </div>
        ) : groupedByCategory ? (
          <div className="space-y-10">
            {Object.entries(groupedByCategory).map(([catName, catItems]) => (
              <div key={catName}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{getCategoryEmoji(catName)}</span>
                  <h2 className="text-xl font-bold text-gold font-serif">{catName}</h2>
                  <span className="text-xs text-jet-muted ml-1">({catItems.length})</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                  {catItems.map((item, i) => (
                    <FoodCard
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      price={item.price}
                      category={item.category}
                      imageUrl={item.imageUrl}
                      description={item.description}
                      index={i}
                      offerPercentage={item.offerPercentage}
                      offerActive={item.offerActive}
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {filtered.map((item, i) => (
              <FoodCard
                key={item.id}
                id={item.id}
                name={item.name}
                price={item.price}
                category={item.category}
                imageUrl={item.imageUrl}
                description={item.description}
                index={i}
                offerPercentage={item.offerPercentage}
                offerActive={item.offerActive}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          recommended={recommended}
          onItemSelect={(item) => setSelectedItem(item)}
        />
      )}
    </div>
  );
}
