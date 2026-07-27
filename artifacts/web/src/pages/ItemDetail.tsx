import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { customFetch } from "@/lib/api-client-react";
import { useCart } from "@/contexts/CartContext";
import { FoodCard } from "@/components/FoodCard";
import { ArrowLeft, Minus, Plus, ShoppingCart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

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
  offerLabel?: string;
  hasSizes?: boolean;
  priceSmall?: number;
  priceMedium?: number;
  priceLarge?: number;
}

export default function ItemDetail() {
  const params = useParams();
  const id = params.id;
  const [, setLocation] = useLocation();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { addItem, getItemQuantity, items, updateQuantity } = useCart();
  const qty = getItemQuantity(id!);

  useEffect(() => {
    Promise.all([
      customFetch<MenuItem[]>("/api/mobile/menu"),
      customFetch<Record<string, any>>("/api/mobile/settings"),
    ])
      .then(([menuData, settingsData]) => {
        const available = menuData.filter((i) => i.isAvailable !== false);
        setAllItems(available);
        setItem(available.find((i) => i.id === id) ?? null);
        setSettings(settingsData);
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id]);

  const RECOMMENDED_IDS = settings.recommendedItemIds || ["m7", "m8", "m9", "m10"];
  const recommended = allItems
    .filter((i) => RECOMMENDED_IDS.includes(i.id) && i.id !== id)
    .sort((a, b) => RECOMMENDED_IDS.indexOf(a.id) - RECOMMENDED_IDS.indexOf(b.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-gray-400">
        <p className="text-lg font-medium">Item not found</p>
        <button onClick={() => setLocation("/menu")} className="mt-4 text-brand font-medium hover:underline">
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => setLocation("/menu")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Menu
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square rounded-2xl bg-surface flex items-center justify-center">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <span className="text-6xl opacity-30">🍗</span>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">{item.category}</span>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{item.name}</h1>
          {item.description && (
            <p className="text-gray-600 mt-3 leading-relaxed">{item.description}</p>
          )}
          <div className="mt-6">
            {(() => {
              const hasOffer = item.offerActive && typeof item.offerPercentage === "number" && item.offerPercentage > 0;
              const salePrice = hasOffer ? Math.round(item.price * (1 - (item.offerPercentage || 0) / 100)) : item.price;
              return (
                <>
                  <span className="text-2xl font-bold text-brand">Rs. {salePrice.toLocaleString()}</span>
                  {hasOffer && (
                    <>
                      <span className="text-sm text-gray-400 line-through ml-2">Rs. {item.price.toLocaleString()}</span>
                      <span className="ml-2 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{item.offerPercentage}% OFF</span>
                    </>
                  )}
                </>
              );
            })()}
          </div>
          <div className="mt-6 flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const hasOffer = item.offerActive && typeof item.offerPercentage === "number" && item.offerPercentage > 0;
                const salePrice = hasOffer ? Math.round(item.price * (1 - (item.offerPercentage || 0) / 100)) : item.price;
                addItem({ itemId: item.id, name: item.name, price: salePrice, category: item.category, imageUrl: item.imageUrl });
              }}
              className="flex-1 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <ShoppingCart className="w-4 h-4" />
              {qty > 0 ? "Add Another" : "Add to Cart"}
            </motion.button>
            {qty > 0 && (
              <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2">
                <button
                  onClick={() => {
                    const hasOffer = item.offerActive && typeof item.offerPercentage === "number" && item.offerPercentage > 0;
                    const salePrice = hasOffer ? Math.round(item.price * (1 - (item.offerPercentage || 0) / 100)) : item.price;
                    addItem({ itemId: item.id, name: item.name, price: salePrice, category: item.category, imageUrl: item.imageUrl });
                  }}
                  className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <span className="font-bold text-sm min-w-[1.5rem] text-center">{qty}</span>
                <button
                  onClick={() => {
                    const cartItem = items.find((i) => i.itemId === item.id);
                    if (cartItem) {
                      updateQuantity(cartItem.cartId, cartItem.quantity - 1);
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {recommended.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-16"
        >
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-brand" />
            <h2 className="text-xl font-bold text-gray-900">You might also like</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
            {recommended.map((r, i) => (
              <div key={r.id} className="shrink-0 w-44">
                <FoodCard
                  id={r.id}
                  name={r.name}
                  price={r.price}
                  category={r.category}
                  imageUrl={r.imageUrl}
                  description={r.description}
                  index={i}
                  offerPercentage={r.offerPercentage}
                  offerActive={r.offerActive}
                />
              </div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
