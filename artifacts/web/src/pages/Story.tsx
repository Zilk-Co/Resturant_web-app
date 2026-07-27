import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { customFetch } from "@workspace/api-client-react";
import { MapPin, Heart, Star, Utensils } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

interface ContentBlock {
  key: string;
  label: string;
  value: string;
  section: string;
}

export default function Story() {
  const { settings } = useSettings();
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customFetch<ContentBlock[]>("/api/mobile/website-content")
      .then((data) => {
        const map: Record<string, string> = {};
        data.forEach((c) => { map[c.key] = c.value; });
        setContent(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const get = (key: string, fallback: string) => content[key] || fallback;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-rembrandt">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="relative text-white py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0">
          {(settings.storyHeroImageUrl) ? (
            <>
              <img src={settings.storyHeroImageUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-rembrandt/60" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-deep via-rembrandt to-rembrandt-mid" />
          )}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-72 h-72 bg-gold rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-crimson rounded-full blur-3xl" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block bg-gold/20 text-gold text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.15em] mb-6 border border-gold/30 font-serif">
              {get("story_hero_tag", "Our Journey")}
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight font-serif tracking-tight">
              <span className="text-gold">{get("story_hero_title", "The THB Story")}</span>
            </h1>
            <p className="mt-4 text-off-white/70 text-lg md:text-xl max-w-2xl mx-auto font-light">
              {get("story_hero_subtitle", "From a dream in Pakistan to your favorite restaurant")}
            </p>
            <p className="mt-5 font-['Caveat'] text-2xl md:text-3xl text-[#E5C158]">
              {get("story_hero_tagline", "From Pakistan With Turkish Inspiration")}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-20 bg-rembrandt">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-crimson/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-crimson" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white font-serif tracking-wide">
              {get("story_origin_title", "From Pakistan With Love")}
            </h2>
          </div>
          <div className="space-y-4 text-off-white-dim leading-relaxed font-sans">
            {get("story_origin_text", "The Hunger Bite Istanbul was born from a simple belief: that everyone deserves access to high-quality, halal-certified food made with love, tradition, and a touch of Turkish culinary magic.").split("\n").map((para, i) => {
              if (i === 0) {
                const parts = para.split(/(love, tradition, and a touch of Turkish culinary magic)/);
                return (
                  <p key={i} className="font-['Caveat'] text-xl md:text-2xl text-[#CBD5E1] leading-relaxed">
                    {parts.map((part, j) =>
                      part === "love, tradition, and a touch of Turkish culinary magic" ? (
                        <span key={j} className="text-[#C8102E] font-semibold">{part}</span>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                  </p>
                );
              }
              return <p key={i} className="font-sans text-off-white-dim leading-relaxed">{para}</p>;
            })}
          </div>
        </motion.div>
      </section>

      <section className="thb-section-green py-16 md:py-20 mx-4 md:mx-6 rounded-2xl">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white font-serif tracking-wide">
              {get("story_values_title", "What We Stand For")}
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Utensils, title: get("story_val1_title", "Quality First"), desc: get("story_val1_text", "Every piece of chicken is halal-certified, freshly prepared, and cooked to perfection using our signature spice blends.") },
              { icon: Heart, title: get("story_val2_title", "Made With Love"), desc: get("story_val2_text", "We don't just cook food — we craft experiences. Every dish is prepared with the same care you'd find in a family kitchen.") },
              { icon: Star, title: get("story_val3_title", "Community"), desc: get("story_val3_text", "We believe in giving back. THB is more than a restaurant — it's a gathering place for families and friends.") },
            ].map((val, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/5 text-center hover:border-gold/20 transition-all">
                <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <val.icon className="w-7 h-7 text-gold" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2 font-serif tracking-wide">{val.title}</h3>
                <p className="text-off-white-dim/80 text-sm leading-relaxed font-sans">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-20 bg-rembrandt">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white font-serif tracking-wide">
            {get("story_journey_title", "Our Journey")}
          </h2>
          <p className="mt-3 text-off-white-dim max-w-xl mx-auto font-sans font-light">
            {get("story_journey_subtitle", "From a single restaurant to a beloved brand")}
          </p>
        </motion.div>
        <div className="space-y-6">
          {get("story_journey_text", "2020|Founded our first location in Karachi|Starting with just a small menu and big dreams\n2021|Expanded to 3 locations|Growing faster than we ever imagined\n2022|Introduced our loyalty program|Rewarding our most loyal customers\n2023|Launched delivery services|Bringing THB to your doorstep\n2024|Opened 10th location|A milestone we celebrate with our community\n2025|Going digital|Launching our app for easier ordering").split("\n").map((line, i) => {
            const [year, title, desc] = line.split("|");
            return (
              <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex gap-5 items-start">
                <div className="shrink-0 w-16 text-center">
                  <div className="bg-gold text-rembrandt text-sm font-bold rounded-lg py-2 font-sans">{year}</div>
                </div>
                <div className="flex-1 bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow cursor-default" style={{ animation: "none" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.animation = "hover-shake 0.5s ease-in-out"; }} onAnimationEnd={(e) => { (e.currentTarget as HTMLElement).style.animation = "none"; }}>
                  <h3 className="font-bold text-jet font-serif">{title}</h3>
                  <p className="text-sm text-jet-muted mt-1 font-sans leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="thb-section-green py-16 md:py-20 mx-4 md:mx-6 rounded-2xl">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white font-serif tracking-wide">
              {get("story_locations_title", "Where You Can Find Us")}
            </h2>
          </motion.div>
          <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-crimson/20 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-crimson" />
              </div>
              <div className="text-off-white-dim leading-relaxed whitespace-pre-line font-sans">
                {get("story_locations_text", "Karachi — Multiple locations across the city\nLahore — Coming soon\nIslamabad — Planned for 2026")}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-20 bg-rembrandt">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-emerald-deep to-emerald-mid rounded-2xl p-8 md:p-12 text-center border border-emerald-light/30">
          {get("story_ceo_image", "") && (
            <img src={get("story_ceo_image", "")} alt={get("story_ceo_name", "CEO")} className="w-24 h-24 rounded-full object-cover mx-auto mb-6 border-4 border-gold/30" />
          )}
          <blockquote className="text-lg md:text-xl italic leading-relaxed max-w-2xl mx-auto mb-6 text-off-white font-sans">
            &ldquo;{get("story_ceo_quote", "We started THB with a simple mission: to serve food that brings families together. Every recipe, every ingredient, every smile from our team reflects that commitment. Thank you for being part of our story.")}&rdquo;
          </blockquote>
          <div>
            <p className="font-bold text-lg text-gold font-serif">{get("story_ceo_name", "The THB Team")}</p>
            <p className="text-off-white-dim/60 text-sm font-sans">{get("story_ceo_title", "Founder & CEO")}</p>
          </div>
          <p className="mt-8 font-['Caveat'] text-xl md:text-2xl text-[#E5C158]">
            — {get("story_ceo_tagline", "Made with heart by the THB Culinary Team")}
          </p>
        </motion.div>
      </section>
    </div>
  );
}
