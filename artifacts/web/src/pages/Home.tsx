import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useCart } from "@/contexts/CartContext";
import { Link, useLocation } from "wouter";
import { customFetch } from "@/lib/api-client-react";
import { FoodCard } from "@/components/FoodCard";
import { ItemModal } from "@/components/ItemModal";
import { Skeleton } from "@/components/Skeleton";
import { ArrowRight, Star, Flame, ChevronRight, Quote } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  description?: string;
  isAvailable?: boolean;
  popular?: boolean;
  spicy?: boolean;
  calories?: number;
  offerPercentage?: number;
  offerLabel?: string;
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
  icon?: string;
  emoji?: string;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  text: string;
  date: string;
}

interface WebsiteContent {
  key: string;
  label: string;
  value: string;
  section: string;
}

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { settings } = useSettings();
  const { addItem } = useCart();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<Record<string, string>>({});
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    customFetch<MenuItem[]>("/api/mobile/menu")
      .then((data) => setItems(data.filter((i) => i.isAvailable !== false)))
      .catch(() => {})
      .finally(() => setLoading(false));
    customFetch<Category[]>("/api/mobile/categories")
      .then((data) => setCategories(data || []))
      .catch(() => {});
    customFetch<Review[]>("/api/mobile/reviews")
      .then((data) => setReviews((data || []).slice(0, 6)))
      .catch(() => {});
    customFetch<WebsiteContent[]>("/api/mobile/website-content")
      .then((data) => {
        const map: Record<string, string> = {};
        data.forEach((c) => { map[c.key] = c.value; });
        setContent(map);
      })
      .catch(() => {});
  }, []);

  const popularItems = items.filter((i) => i.popular);
  const deals = items.filter((i) => i.offerActive && i.offerPercentage);

  const heroTitle = (settings as any).heroBannerMainText || "THE HUNGER BITE ISTANBUL";
  const heroSubtitle = (settings as any).heroBannerSubText || "Authentic Taste, Fresh Quality";
  const heroDescription = (settings as any).heroBannerButtonText || "Order Now";
  const heroTag = (settings as any).heroBannerTag || "LIMITED TIME";
  const heroImageUrl = (settings as any).heroBannerImageUrl || "";
  const heroVideoUrl = (settings as any).websiteHeroVideoUrl || "";
  const heroCtaCat = (settings as any).heroBannerCtaCat || "deals";
  const heroCtaLink = heroCtaCat ? `/menu?cat=${encodeURIComponent(heroCtaCat)}` : "/menu";

  const RECOMMENDED_IDS = (settings as any).recommendedItemIds || ["m7", "m8", "m9", "m10"];
  const recommended = items
    .filter((i) => RECOMMENDED_IDS.includes(i.id))
    .sort((a, b) => RECOMMENDED_IDS.indexOf(a.id) - RECOMMENDED_IDS.indexOf(b.id));

  return (
    <div>
      <section className="relative text-white overflow-hidden min-h-[75vh] md:min-h-[85vh] flex items-center">
        <div className="absolute inset-0">
          {heroVideoUrl && !videoFailed ? (
            <>
              <video className="w-full h-full object-cover" autoPlay loop muted playsInline preload="metadata" onError={() => setVideoFailed(true)} src={heroVideoUrl} />
              <div className="absolute inset-0 bg-black/60" />
            </>
          ) : (
            <>
              {heroImageUrl && <img src={heroImageUrl} alt="" className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-r from-rembrandt via-rembrandt/80 to-rembrandt-mid/60" />
            </>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 relative z-10 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-2xl">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.05 }} className="inline-block mb-5">
              <span className="bg-emerald-300/15 text-emerald-300 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider border border-emerald-300/30">
                {heroTag}
              </span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-4xl md:text-6xl font-extrabold leading-[1.1] font-serif">
              <span className="text-gold">{heroTitle}</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="mt-4 text-off-white/70 text-base md:text-lg max-w-lg font-sans font-light">
              {heroSubtitle}
            </motion.p>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mt-2 font-['Caveat'] text-lg md:text-xl text-[#CBD5E1]">
              taste the passion, feel the tradition
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-wrap gap-3 mt-8">
              <Link href={heroCtaLink} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-crimson text-white font-bold text-sm hover:bg-crimson-dark transition-all shadow-xl shadow-crimson-glow hover:shadow-crimson">
                {heroDescription} <ArrowRight className="w-4 h-4" />
              </Link>
              {!user && (
                <Link href="/login" className="inline-flex items-center px-7 py-3.5 rounded-full border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-all backdrop-blur-sm">
                  Sign In
                </Link>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 mt-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="thb-section-green p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-gold" />
              <h2 className="text-2xl md:text-3xl font-bold text-white font-serif">Our Menu</h2>
            </div>
            <Link href="/menu" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-gold to-gold-dim text-white text-sm font-bold shadow-lg shadow-gold-glow hover:shadow-xl hover:scale-105 hover:from-gold-dim hover:to-gold transition-all duration-300 group">
              View Our Menu <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {categories.map((cat, i) => {
              const count = items.filter((item) => item.category === cat.slug || item.category === cat.name).length;
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setLocation(`/menu?cat=${encodeURIComponent(cat.slug || cat.name)}`)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-gold/30 transition-all group cursor-pointer"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">
                    {cat.emoji || "🍽"}
                  </span>
                  <span className="text-xs font-medium text-white text-center leading-tight">{cat.name}</span>
                  <span className="text-[10px] text-off-white-dim/60">{count} items</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </section>

       {popularItems.length > 0 && (
         <section className="max-w-7xl mx-auto px-4 md:px-6 mt-12">
           <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-2">
                 <Star className="w-5 h-5 text-gold fill-gold" />
                 <h2 className="text-2xl font-bold text-white font-serif">Popular Items</h2>
               </div>
               <Link href="/menu" className="text-gold text-sm font-semibold flex items-center gap-1 hover:text-gold-dim transition-colors">
                 View All <ChevronRight className="w-4 h-4" />
               </Link>
             </div>
            <div className="flex gap-4 md:gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
               {popularItems.map((item, i) => (
                 <div key={item.id} className="flex-none w-[160px] sm:w-[180px] md:w-[200px] snap-start">
                   <FoodCard
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
                 </div>
               ))}
             </div>
          </motion.div>
        </section>
      )}

       {deals.length > 0 && (
         <section className="max-w-7xl mx-auto px-4 md:px-6 mt-12">
<motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="thb-section-green p-6 md:p-8">
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-2">
                 <Flame className="w-5 h-5 text-crimson" />
                 <h2 className="text-2xl font-bold text-white font-serif">Hot Deals</h2>
               </div>
               <Link href="/menu" className="text-gold text-sm font-semibold flex items-center gap-1 hover:text-gold-dim transition-colors">
                 View All <ChevronRight className="w-4 h-4" />
               </Link>
             </div>
            <div className="flex gap-4 md:gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
               {deals.map((item, i) => (
                 <div key={item.id} className="flex-none w-[160px] sm:w-[180px] md:w-[200px] snap-start">
                   <FoodCard
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
                 </div>
               ))}
             </div>
          </motion.div>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-6 mt-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Quote className="w-5 h-5 text-gold fill-gold" />
                <h2 className="text-xl font-bold text-white font-serif">What People Say</h2>
              </div>
              <Link href="/reviews" className="text-gold text-sm font-semibold flex items-center gap-1 hover:text-gold-dim transition-colors">
                All Reviews <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="shrink-0 w-80 bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-gold/20 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-crimson to-crimson-dark flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {review.userName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{review.userName}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "text-gold fill-gold" : "text-white/20"}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-off-white-dim leading-relaxed line-clamp-3">{review.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 md:px-6 mt-12 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-r from-emerald-deep via-emerald-mid to-emerald-deep rounded-2xl p-8 md:p-12 text-center border border-emerald-light/30">
          <h2 className="text-2xl md:text-3xl font-bold text-white font-serif">
            {content.cta_title || "Ready to Order?"}
          </h2>
          <p className="text-off-white-dim mt-3 max-w-lg mx-auto">
            {content.cta_subtitle || "Fresh, halal-certified food delivered to your doorstep"}
          </p>
          <Link href="/menu" className="inline-flex items-center gap-2 mt-6 px-8 py-3.5 rounded-full bg-crimson text-white font-bold text-sm hover:bg-crimson-dark transition-all shadow-xl shadow-crimson-glow no-underline">
            {content.cta_button || "Explore Menu"} <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

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
