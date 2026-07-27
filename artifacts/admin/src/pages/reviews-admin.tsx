import { Shell } from "@/components/layout/Shell";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Star, Trash2, CheckCircle2, XCircle, Loader2, MessageSquare } from "lucide-react";

const API_BASE = "/api";

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  imageUrl?: string;
  date: string;
  approved: boolean;
}

export default function ReviewsAdmin() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/admin/reviews/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {}
    setActionLoading(null);
  };

  const handleToggleApproval = async (id: string, currentApproved: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: !currentApproved }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, approved: !currentApproved } : r))
        );
      }
    } catch {}
    setActionLoading(null);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col gap-8 pb-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
            <MessageSquare className="w-8 h-8" /> Reviews
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage customer reviews. {reviews.length} total reviews.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border rounded-xl p-5">
            <p className="text-sm text-muted-foreground">Average Rating</p>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-5 h-5 text-gold fill-gold" />
              <span className="text-2xl font-bold">{avgRating}</span>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-5">
            <p className="text-sm text-muted-foreground">Total Reviews</p>
            <p className="text-2xl font-bold mt-1">{reviews.length}</p>
          </div>
          <div className="bg-card border rounded-xl p-5">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold mt-1 text-green-600">
              {reviews.filter((r) => r.approved).length}
            </p>
          </div>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="bg-card border rounded-2xl p-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg font-medium">No reviews yet</p>
            <p className="text-muted-foreground/60 text-sm mt-1">Reviews will appear here once customers submit them.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className={`bg-card border rounded-2xl p-5 ${
                  !review.approved ? "opacity-60 border-dashed" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {review.userName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">{review.userName}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= review.rating ? "text-gold fill-gold" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {!review.approved && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                              Pending Approval
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleApproval(review.id, review.approved)}
                          disabled={actionLoading === review.id}
                          className={review.approved ? "text-yellow-600 hover:bg-yellow-50" : "text-green-600 hover:bg-green-50"}
                        >
                          {review.approved ? (
                            <><XCircle className="w-4 h-4 mr-1" />Unapprove</>
                          ) : (
                            <><CheckCircle2 className="w-4 h-4 mr-1" />Approve</>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(review.id)}
                          disabled={actionLoading === review.id}
                          className="text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="mt-2 text-gray-600 text-sm leading-relaxed">{review.text}</p>
                    {review.imageUrl && (
                      <img
                        src={review.imageUrl}
                        alt="Review"
                        className="mt-3 rounded-xl max-h-32 object-cover border"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
