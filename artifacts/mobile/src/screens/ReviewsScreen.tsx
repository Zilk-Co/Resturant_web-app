import Feather from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { customFetch } from "@/lib/api-client";

type Review = {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  imageUrl: string | null;
  date: string;
  approved: boolean;
};

function StarRow({ rating, size = 14, color = "#D4AF37" }: { rating: number; size?: number; color?: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Feather
          key={i}
          name="star"
          size={size}
          color={i <= rating ? color : "#E5E7EB"}
          style={i <= rating ? { fillColor: color } : undefined}
        />
      ))}
    </View>
  );
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={ratingBarStyles.row}>
      <Text style={ratingBarStyles.label}>{star}</Text>
      <Feather name="star" size={10} color="#D4AF37" style={{ fillColor: "#D4AF37" }} />
      <View style={ratingBarStyles.track}>
        <View style={[ratingBarStyles.fill, { width: `${pct}%` as any }]} />
      </View>
      <Text style={ratingBarStyles.count}>{count}</Text>
    </View>
  );
}

const ratingBarStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#6B7280", width: 12 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "#E5E7EB", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3, backgroundColor: "#D4AF37" },
  count: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#9CA3AF", width: 20, textAlign: "right" },
});

export default function ReviewsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [myRating, setMyRating] = useState(0);
  const [myText, setMyText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await customFetch<Review[]>("/api/mobile/reviews");
      setReviews(data || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const handleSubmit = async () => {
    setFormError(null);
    if (myRating < 1 || myRating > 5) {
      setFormError(language === "ur" ? "_star منتخب کریں" : "Please select a star rating");
      return;
    }
    if (myText.trim().length < 10) {
      setFormError(language === "ur" ? "至少 10 حروف درکار ہیں" : "Review must be at least 10 characters");
      return;
    }
    if (myText.trim().length > 500) {
      setFormError(language === "ur" ? "500 حروف کی حد ہے" : "Review must be under 500 characters");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await customFetch("/api/mobile/reviews", {
        method: "POST",
        body: JSON.stringify({ rating: myRating, text: myText.trim() }),
      });
      setMyRating(0);
      setMyText("");
      setSuccessMsg(language === "ur" ? "آپ کا جائزہ شائع ہو گیا!" : "Your review has been posted!");
      fetchReviews();
    } catch (err: any) {
      setFormError(err?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "";
    }
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad + 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Rating Summary */}
      <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.summaryLeft}>
          <Text style={[styles.avgNumber, { color: colors.foreground }]}>
            {avgRating.toFixed(1)}
          </Text>
          <StarRow rating={Math.round(avgRating)} size={16} />
          <Text style={[styles.totalText, { color: colors.mutedForeground }]}>
            {reviews.length} {language === "ur" ? "جائزے" : "reviews"}
          </Text>
        </View>
        <View style={styles.summaryRight}>
          {ratingDist.map((d) => (
            <RatingBar key={d.star} star={d.star} count={d.count} total={reviews.length} />
          ))}
        </View>
      </View>

      {/* Success Message */}
      {successMsg && (
        <View style={[styles.successBox, { backgroundColor: "#E6F5ED", borderColor: "#006233" }]}>
          <Feather name="check-circle" size={16} color="#006233" />
          <Text style={[styles.successText, { color: "#006233" }]}>{successMsg}</Text>
        </View>
      )}

      {/* Submit Form */}
      {user ? (
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>
            {language === "ur" ? "اپنا جائزہ لکھیں" : "Write a Review"}
          </Text>

          {/* Star Picker */}
          <View style={styles.starPicker}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} onPress={() => setMyRating(i)} activeOpacity={0.6}>
                <Feather
                  name="star"
                  size={30}
                  color={i <= myRating ? "#D4AF37" : "#E5E7EB"}
                  style={i <= myRating ? { fillColor: "#D4AF37" } : undefined}
                />
              </TouchableOpacity>
            ))}
            {myRating > 0 && (
              <Text style={[styles.ratingLabel, { color: colors.mutedForeground }]}>
                {myRating === 5 ? "Excellent" : myRating === 4 ? "Great" : myRating === 3 ? "Average" : myRating === 2 ? "Poor" : "Terrible"}
              </Text>
            )}
          </View>

          {/* Text Input */}
          <View style={[styles.textAreaWrapper, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textArea, { color: colors.foreground }]}
              placeholder={language === "ur" ? "اپنا تجربہ شیئر کریں..." : "Share your experience..."}
              placeholderTextColor={colors.mutedForeground}
              value={myText}
              onChangeText={setMyText}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
              {myText.length}/500
            </Text>
          </View>

          {formError && (
            <Text style={styles.formError}>{formError}</Text>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, { opacity: submitting || myRating === 0 || myText.trim().length < 10 ? 0.5 : 1 }]}
            onPress={handleSubmit}
            disabled={submitting || myRating === 0 || myText.trim().length < 10}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="send" size={16} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>
                  {language === "ur" ? "جائزہ جمع کریں" : "Submit Review"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.loginPrompt, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => (navigation as any).navigate("Login")}
          activeOpacity={0.7}
        >
          <Feather name="log-in" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.loginTitle, { color: colors.foreground }]}>
              {language === "ur" ? "جائزہ دینے کے لیے سائن ان کریں" : "Sign in to write a review"}
            </Text>
            <Text style={[styles.loginSub, { color: colors.mutedForeground }]}>
              {language === "ur" ? "اپنا تجربہ دوسروں کے ساتھ شیئر کریں" : "Share your experience with others"}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}

      {/* Reviews List */}
      <View style={styles.listSection}>
        <Text style={[styles.listTitle, { color: colors.foreground }]}>
          {language === "ur" ? "تمام جائزے" : "All Reviews"}
        </Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : reviews.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="message-circle" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {language === "ur" ? "ابھی تک کوئی جائزہ نہیں" : "No reviews yet. Be the first!"}
            </Text>
          </View>
        ) : (
          reviews.map((review) => (
            <View
              key={review.id}
              style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.reviewHeader}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {review.userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.reviewMeta}>
                  <Text style={[styles.reviewerName, { color: colors.foreground }]}>
                    {review.userName}
                  </Text>
                  <Text style={[styles.reviewDate, { color: colors.mutedForeground }]}>
                    {formatDate(review.date)}
                  </Text>
                </View>
                <StarRow rating={review.rating} size={12} />
              </View>
              <Text style={[styles.reviewText, { color: colors.mutedForeground }]}>
                {review.text}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryCard: {
    flexDirection: "row",
    margin: 16,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 20,
  },
  summaryLeft: { alignItems: "center", justifyContent: "center", minWidth: 90 },
  avgNumber: { fontSize: 38, fontFamily: "Inter_700Bold", marginBottom: 4 },
  totalText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  summaryRight: { flex: 1, justifyContent: "center" },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  successText: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  formCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
  },
  formTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 14 },
  starPicker: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  ratingLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginLeft: 8 },
  textAreaWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  textArea: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    minHeight: 100,
    padding: 0,
  },
  charCount: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 4 },
  formError: { color: "#C8102E", fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 8 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#C8102E",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 15, fontFamily: "Inter_700Bold" },
  loginPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  loginTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  loginSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  listSection: { paddingHorizontal: 16 },
  listTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 14 },
  loadingBox: { alignItems: "center", paddingVertical: 40 },
  emptyBox: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  reviewCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  reviewMeta: { flex: 1 },
  reviewerName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  reviewDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  reviewText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
