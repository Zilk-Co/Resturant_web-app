import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { X, Minus, Plus, ShoppingCart, AlertTriangle, Star } from "lucide-react";

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

interface ItemModalProps {
  item: MenuItem;
  onClose: () => void;
  recommended?: MenuItem[];
  onItemSelect?: (item: MenuItem) => void;
}

export function ItemModal({ item, onClose, recommended = [], onItemSelect }: ItemModalProps) {
  const { addItem, getItemQuantity } = useCart();
  const [qty, setQty] = useState(1);
  const [exiting, setExiting] = useState(false);
  const [selectedSize, setSelectedSize] = useState<"small" | "medium" | "large" | null>(null);

  const filteredRecommended = recommended
    .filter((r) => r.id !== item.id);

  const closeWithAnim = useCallback(() => {
    setExiting(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeWithAnim(); };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [closeWithAnim]);

  const hasOffer = item.offerActive && typeof item.offerPercentage === "number" && item.offerPercentage > 0;
  const basePrice = hasOffer ? Math.round(item.price * (1 - (item.offerPercentage || 0) / 100)) : item.price;
  const sizePrice = item.hasSizes && selectedSize
    ? (selectedSize === "small" ? (item.priceSmall ?? item.price) : selectedSize === "medium" ? (item.priceMedium ?? item.price) : (item.priceLarge ?? item.price))
    : null;
  const salePrice = sizePrice !== null ? (hasOffer ? Math.round(sizePrice * (1 - (item.offerPercentage || 0) / 100)) : sizePrice) : basePrice;
  const total = salePrice * qty;
  const callout = (item as any).callout || null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        onClick={closeWithAnim}
      >
        <div className="absolute inset-0 bg-rembrandt/80 backdrop-blur-md" />
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: exiting ? 0 : 1, scale: exiting ? 0.92 : 1, y: exiting ? 16 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={closeWithAnim}
            title="Close"
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-emerald-deep/80 backdrop-blur-sm text-white flex items-center justify-center hover:bg-emerald-deep transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="aspect-[16/10] bg-gradient-to-br from-matte to-gray-100 rounded-t-3xl overflow-hidden relative">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rembrandt/5 to-rembrandt/10">
                <svg className="w-16 h-16 text-rembrandt/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-1.1 0-2-.45-2-1s.9-1 2-1 2 .45 2 1-.9 1-2 1zm-4-4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm8 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                </svg>
              </div>
            )}
            {hasOffer && (
              <div className="absolute top-4 left-4 bg-crimson text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                {item.offerPercentage}% OFF
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-[10px] uppercase tracking-widest text-gold-dim font-semibold">{item.category}</span>
                <h2 className="text-2xl font-bold text-jet mt-1 font-serif">{item.name}</h2>
              </div>
              {hasOffer && (
                <div className="flex items-center gap-1 bg-crimson/10 px-2.5 py-1 rounded-full shrink-0">
                  <Star className="w-3 h-3 text-crimson fill-crimson" />
                  <span className="text-xs font-bold text-crimson">{item.offerPercentage}% OFF</span>
                </div>
              )}
            </div>

            {item.description && (
              <p className="text-sm text-jet-muted mt-3 leading-relaxed">{item.description}</p>
            )}

            {callout && (
              <div className="mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">{callout}</p>
              </div>
            )}

            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-2xl font-extrabold text-crimson">Rs. {salePrice.toLocaleString()}</span>
              {hasOffer && (
                <span className="text-sm text-jet-muted line-through">Rs. {item.price.toLocaleString()}</span>
              )}
            </div>

            {item.hasSizes && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-jet-muted mb-2 uppercase tracking-wider">Select Size</p>
                <div className="flex gap-2">
                  {(["small", "medium", "large"] as const).map((size) => {
                    const sizeVal = size === "small" ? item.priceSmall : size === "medium" ? item.priceMedium : item.priceLarge;
                    if (!sizeVal) return null;
                    const displayPrice = hasOffer ? Math.round(sizeVal * (1 - (item.offerPercentage || 0) / 100)) : sizeVal;
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                          isSelected
                            ? "bg-crimson text-white border-crimson shadow-lg shadow-crimson-glow"
                            : "bg-white text-jet border-gray-200 hover:border-crimson/50"
                        }`}
                      >
                        <span className="capitalize">{size}</span>
                        <span className="block text-xs mt-0.5 opacity-80">Rs. {displayPrice.toLocaleString()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center bg-matte rounded-full border border-gray-200">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  title="Decrease quantity"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-jet-muted hover:text-jet hover:bg-gray-200 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-jet text-sm">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  title="Increase quantity"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-jet-muted hover:text-jet hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (item.hasSizes && !selectedSize) return;
                  const sizeLabel = selectedSize ? ` (${selectedSize})` : "";
                  addItem({ itemId: item.id, name: `${item.name}${sizeLabel}`, price: salePrice, category: item.category, imageUrl: item.imageUrl }, qty);
                  closeWithAnim();
                }}
                className={`flex-1 py-3.5 rounded-full text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                  item.hasSizes && !selectedSize
                    ? "bg-gray-300 cursor-not-allowed shadow-none"
                    : "bg-crimson hover:bg-crimson-dark shadow-crimson-glow"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {item.hasSizes && !selectedSize ? "Select a size" : `Add to Order — Rs. ${total.toLocaleString()}`}
              </motion.button>
            </div>

            {qty > 0 && getItemQuantity(item.id) > 0 && (
              <p className="text-center text-xs text-jet-muted mt-3">
                You already have {getItemQuantity(item.id)} in your cart
              </p>
            )}
          </div>

          {filteredRecommended.length > 0 && (
            <div className="border-t border-gray-100 p-6">
              <h3 className="font-['Caveat'] text-lg text-[#111] mb-3">you might also like</h3>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
                {filteredRecommended.map((r) => {
                  const rOffer = r.offerActive && typeof r.offerPercentage === "number" && r.offerPercentage > 0;
                  const rSale = rOffer ? Math.round(r.price * (1 - (r.offerPercentage || 0) / 100)) : r.price;
                  return (
                    <button
                      key={r.id}
                      onClick={() => onItemSelect?.(r)}
                      className="shrink-0 w-36 text-left bg-matte rounded-xl overflow-hidden hover:shadow-md transition-shadow border border-gray-100"
                    >
                      <div className="aspect-[4/3] bg-gradient-to-br from-matte to-gray-100 flex items-center justify-center overflow-hidden">
                        {r.imageUrl ? (
                          <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-8 h-8 text-rembrandt/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-1.1 0-2-.45-2-1s.9-1 2-1 2 .45 2 1-.9 1-2 1zm-4-4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm8 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                          </svg>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-jet truncate">{r.name}</p>
                        <p className="thb-price text-sm mt-0.5">Rs. {rSale.toLocaleString()}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
