import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface FoodCardProps {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  description?: string;
  index?: number;
  offerPercentage?: number;
  offerActive?: boolean;
  onClick?: () => void;
}

export function FoodCard({ id, name, price, category, imageUrl, description, index = 0, offerPercentage, offerActive, onClick }: FoodCardProps) {
  const { addItem, getItemQuantity } = useCart();
  const qty = getItemQuantity(id);
  const hasOffer = offerActive && typeof offerPercentage === "number" && offerPercentage > 0;
  const salePrice = hasOffer ? Math.round(price * (1 - (offerPercentage || 0) / 100)) : price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="thb-card-white overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-matte to-gray-100 flex items-center justify-center overflow-hidden relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rembrandt/5 to-rembrandt/10">
            <svg className="w-12 h-12 text-rembrandt/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-1.1 0-2-.45-2-1s.9-1 2-1 2 .45 2 1-.9 1-2 1zm-4-4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm8 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
            </svg>
          </div>
        )}
        {hasOffer && (
          <div className="absolute top-3 left-3 bg-crimson text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
            {offerPercentage}% OFF
          </div>
        )}
      </div>
      <div className="p-3.5">
          <span className="text-[10px] uppercase tracking-widest text-gold-dim font-semibold">{category}</span>
          <h3 className="font-bold text-jet text-sm leading-tight mt-0.5 group-hover:text-crimson transition-colors font-serif">{name}</h3>
          {description && (
            <p className="text-xs text-jet-muted mt-1 line-clamp-1 font-sans">{description}</p>
          )}
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-baseline gap-2">
            <span className="thb-price text-base">Rs. {salePrice.toLocaleString()}</span>
            {hasOffer && (
              <span className="text-xs text-jet-muted line-through">Rs. {price.toLocaleString()}</span>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addItem({ itemId: id, name, price: salePrice, category, imageUrl });
            }}
            className="w-8 h-8 rounded-full bg-crimson text-white flex items-center justify-center hover:bg-crimson-dark transition-all shadow-md shadow-crimson-glow hover:shadow-lg"
          >
            {qty > 0 ? <span className="text-xs font-bold">{qty}</span> : <Plus className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
