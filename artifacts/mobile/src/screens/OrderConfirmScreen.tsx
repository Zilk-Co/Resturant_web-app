import Feather from "react-native-vector-icons/Feather";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOrders } from "@/contexts/OrderContext";
import { useColors } from "@/hooks/useColors";

export default function OrderConfirmScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };
  const { orders } = useOrders();
  const { awardPoints, user } = useAuth();
  const { t, language } = useLanguage();
  const order = orders.find((o) => o.id === orderId);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkStroke = useRef(new Animated.Value(0)).current;
  const [pointsEarned, setPointsEarned] = useState(0);
  const pointsFade = useRef(new Animated.Value(0)).current;
  const pointsSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Animate the check circle
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 11, stiffness: 130 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();

    // Award loyalty points
    if (order && user) {
      awardPoints(order.total).then((awarded) => {
        if (awarded > 0) {
          setPointsEarned(awarded);
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(pointsFade, { toValue: 1, duration: 500, useNativeDriver: true }),
              Animated.spring(pointsSlide, { toValue: 0, damping: 14, stiffness: 100, useNativeDriver: true }),
            ]).start();
          }, 900);
        }
      });
    }
  }, []);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const orderTypeLabel =
    order?.orderType === "delivery" ? t("delivery") :
    order?.orderType === "dinein" ? t("dineIn") : t("takeaway");

  return (
    <LinearGradient
      colors={[colors.darkGreen, colors.primary]}
      style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad + 20 }]}
    >
      {/* Animated Check */}
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.iconRing}>
          <View style={styles.iconCircle}>
            <Feather name="check" size={52} color={colors.primary} />
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.title}>{t("orderPlaced")}</Text>
        <Text style={styles.subtitle}>
          {language === "ur"
            ? "آپ کا THB آرڈر تصدیق ہو گیا ہے۔"
            : "Your THB order is confirmed and on its way!"}
        </Text>

        {/* Points earned banner */}
        {pointsEarned > 0 && (
          <Animated.View style={[styles.pointsBanner, { opacity: pointsFade, transform: [{ translateY: pointsSlide }] }]}>
            <Feather name="star" size={16} color="#FFD700" />
            <Text style={styles.pointsBannerText}>
              {language === "ur"
                ? `+${pointsEarned} پوائنٹس کمائے!`
                : `+${pointsEarned} loyalty points earned!`}
            </Text>
          </Animated.View>
        )}

        {/* Details Card */}
        <View style={styles.detailsCard}>
          {[
            { label: language === "ur" ? "آرڈر نمبر" : "Order ID", value: `#${order?.id ?? orderId}`, bold: true },
            { label: language === "ur" ? "آرڈر کی قسم" : "Order Type", value: orderTypeLabel },
            { label: t("estimatedTime"), value: `~${order?.estimatedMinutes ?? 20} min`, accent: true },
            { label: t("totalPaid"), value: `Rs. ${order?.total.toLocaleString()}`, green: true },
          ].map((row, idx, arr) => (
            <View key={row.label}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                <Text style={[
                  styles.detailValue,
                  { color: row.accent ? colors.accent : row.green ? colors.primary : colors.foreground },
                  row.bold && { fontFamily: "Inter_700Bold" },
                ]}>
                  {row.value}
                </Text>
              </View>
              {idx < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </View>

        {/* Track info */}
        <View style={styles.statusInfo}>
          <Feather name="clock" size={13} color="rgba(255,255,255,0.65)" />
          <Text style={styles.statusText}>
            {language === "ur"
              ? "آرڈرز ٹیب سے ریئل ٹائم میں ٹریک کریں"
              : "Track your order in real time from the Orders tab"}
          </Text>
        </View>
      </Animated.View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity onPress={() => (navigation as any).replace("Orders")} style={styles.trackBtn}>
          <Feather name="clock" size={17} color={colors.primary} />
          <Text style={[styles.trackBtnText, { color: colors.primary }]}>{t("trackOrder")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => (navigation as any).replace("Home")} style={[styles.homeBtn, { backgroundColor: colors.accent }]}>
          <Text style={styles.homeBtnText}>{t("backToHome")}</Text>
          <Feather name="arrow-right" size={17} color="#FFF" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingHorizontal: 20 },
  iconContainer: { marginTop: 40, marginBottom: 20 },
  iconRing: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.25)",
  },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: "#FFFFFF",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10,
  },
  content: { width: "100%", alignItems: "center" },
  title: { color: "#FFFFFF", fontSize: 30, fontFamily: "Inter_700Bold", marginBottom: 6 },
  subtitle: { color: "rgba(255,255,255,0.78)", fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 18, lineHeight: 20 },
  pointsBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,215,0,0.18)", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: "rgba(255,215,0,0.35)", marginBottom: 18, width: "100%",
  },
  pointsBannerText: { color: "#FFD700", fontSize: 14, fontFamily: "Inter_700Bold" },
  detailsCard: {
    width: "100%", backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, marginBottom: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  detailLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  detailValue: { fontSize: 14, fontFamily: "Inter_500Medium" },
  divider: { height: 1 },
  statusInfo: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 16 },
  statusText: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_400Regular" },
  buttons: { width: "100%", gap: 10, marginTop: "auto" },
  trackBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#FFFFFF", borderRadius: 14, paddingVertical: 15, gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  trackBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  homeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 14, paddingVertical: 15, gap: 8 },
  homeBtnText: { color: "#FFFFFF", fontSize: 16, fontFamily: "Inter_700Bold" },
});
