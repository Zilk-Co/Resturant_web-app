import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { customFetch } from "@/lib/api-client-react";
import { Star, Camera, X, Send, Loader2 } from "lucide-react";

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  imageUrl?: string;
  date: string;
}

const BANNED_WORDS = ["fuck", "shit", "damn", "ass", "bitch", "bastard", "crap", "dick", "hell", "stupid", "idiot", "moron", "ugly", "disgusting", "trash", "kill", "die", "hate", "racist", "sexist"];

function containsBannedWords(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some((word) => lower.includes(word));
}

function StarRating({ rating, onRate, size = 20 }: { rating: number; onRate?: (r: number) => void; size?: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onRate?.(star)} className={`${onRate ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}`}>
          <Star className={`${size <= 14 ? "w-3.5 h-3.5" : size <= 18 ? "w-4.5 h-4.5" : "w-5 h-5"} ${star <= rating ? "text-gold fill-gold" : "text-gray-300"}`} />
        </button>
      ))}
    </div>
  );
}

export default function Reviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newText, setNewText] = useState("");
  const [newImage, setNewImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    customFetch<Review[]>("/api/mobile/reviews")
      .then((data) => setReviews(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage: reviews.length > 0 ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB"); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Only JPG, PNG, and WebP images are allowed"); return; }
    setError("");
    const reader = new FileReader();
    reader.onload = () => setNewImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setError("");
    if (newRating === 0) { setError("Please select a star rating"); return; }
    if (newText.trim().length < 10) { setError("Review must be at least 10 characters"); return; }
    if (newText.trim().length > 500) { setError("Review must be under 500 characters"); return; }
    if (containsBannedWords(newText)) { setError("Your review contains inappropriate language. Please revise it."); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/mobile/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("rfc_token") || ""}` },
        body: JSON.stringify({ rating: newRating, text: newText.trim(), imageUrl: newImage || undefined }),
      });
      if (res.ok) {
        const newReview = await res.json();
        setReviews((prev) => [newReview, ...prev]);
        setSuccess(true);
        setShowForm(false);
        setNewRating(0);
        setNewText("");
        setNewImage(null);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit review");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen">
      <section className="py-12 md:py-16 bg-rembrandt">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gold font-serif">
              Customer Reviews
            </h1>
            <p className="mt-3 text-off-white-dim">See what our customers are saying about THB</p>
          </motion.div>

          {reviews.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-8 flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-5xl font-extrabold text-gold">{avgRating}</div>
                <StarRating rating={Math.round(parseFloat(avgRating))} size={18} />
                <p className="text-sm text-off-white-dim mt-1">{reviews.length} reviews</p>
              </div>
              <div className="flex-1 max-w-xs space-y-1.5">
                {ratingDistribution.map((d) => (
                  <div key={d.star} className="flex items-center gap-2 text-sm">
                    <span className="w-3 text-off-white-dim text-right">{d.star}</span>
                    <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                    <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                      <div className="bg-gold h-full rounded-full" style={{ width: `${d.percentage}%` }} />
                    </div>
                    <span className="w-6 text-off-white-dim text-xs">{d.count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <section className="bg-slate py-8">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          {user && !showForm && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowForm(true)} className="w-full mb-8 py-4 rounded-2xl border-2 border-dashed border-gray-300 text-jet-muted font-semibold hover:border-crimson hover:text-crimson transition-all flex items-center justify-center gap-2 bg-white/50 backdrop-blur-sm">
              <Star className="w-5 h-5" />
              Write a Review
            </motion.button>
          )}

          {!user && (
            <div className="mb-8 bg-white rounded-2xl p-6 text-center border border-gray-200 shadow-sm">
              <p className="text-jet-muted">
                <a href="/login" className="text-crimson font-semibold hover:underline">Sign in</a> to write a review
              </p>
            </div>
          )}

          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 bg-emerald-deep border border-emerald-light/30 rounded-xl p-4 text-emerald-light text-sm font-medium text-center">
                Thank you! Your review has been submitted successfully.
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-jet font-serif text-lg">Write Your Review</h3>
                    <button onClick={() => { setShowForm(false); setError(""); }} className="text-jet-muted hover:text-jet">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-jet-light mb-1">Rating</label>
                      <StarRating rating={newRating} onRate={setNewRating} size={24} />
                    </div>
                    <div>
                      <label htmlFor="review-text" className="block text-sm font-medium text-jet-light mb-1">Your Review</label>
                      <textarea id="review-text" name="review" value={newText} onChange={(e) => setNewText(e.target.value)} rows={4} maxLength={500} placeholder="Tell us about your experience..." className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-jet focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30 resize-none" />
                      <p className="text-xs text-jet-muted mt-1 text-right">{newText.length}/500</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-jet-light mb-1">Photo (optional)</label>
                      {newImage ? (
                        <div className="relative inline-block">
                          <img src={newImage} alt="Review" className="w-24 h-24 object-cover rounded-xl" />
                          <button onClick={() => setNewImage(null)} title="Remove photo" className="absolute -top-2 -right-2 w-6 h-6 bg-crimson text-white rounded-full flex items-center justify-center">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                          <label htmlFor="review-photo" className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-300 text-jet-muted text-sm cursor-pointer hover:border-crimson hover:text-crimson transition-colors">
                            <Camera className="w-4 h-4" />
                            Upload a photo
                            <input id="review-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                    {error && <p className="text-crimson text-sm">{error}</p>}
                    <button onClick={handleSubmit} disabled={submitting} className="w-full py-3 rounded-full bg-crimson text-white font-semibold hover:bg-crimson-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-crimson-glow">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {submitting ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="bg-rembrandt py-8 pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse shadow-sm">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-matte rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-matte rounded w-1/4" />
                      <div className="h-3 bg-matte rounded w-1/3" />
                      <div className="h-3 bg-matte rounded w-full mt-3" />
                      <div className="h-3 bg-matte rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16">
              <Star className="w-12 h-12 text-jet-muted mx-auto mb-4" />
              <p className="font-['Caveat'] text-2xl text-[#CBD5E1]">no voices yet...</p>
              <p className="text-jet-muted text-sm mt-1 font-sans">Be the first to share your experience!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review, i) => (
                <motion.div key={review.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-crimson/10 flex items-center justify-center text-crimson font-bold text-sm shrink-0">
                      {review.userName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-jet text-sm">{review.userName}</h4>
                          <StarRating rating={review.rating} size={14} />
                        </div>
                        <span className="text-xs text-jet-muted">
                          {new Date(review.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <p className="mt-2 text-jet-muted text-sm leading-relaxed">{review.text}</p>
                      {review.imageUrl && <img src={review.imageUrl} alt="Review photo" className="mt-3 rounded-xl max-h-48 object-cover" />}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
