import Feather from "react-native-vector-icons/Feather";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DealCard } from "@/components/DealCard";
import { FoodCard } from "@/components/FoodCard";
import { HeroBanner } from "@/components/HeroBanner";
import { Deal, MenuItem } from "@/constants/data";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMenu } from "@/contexts/MenuContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useOrderType } from "@/contexts/OrderTypeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import { resolveMenuImageUrl } from "@/lib/menuUtils";
import { customFetch } from "@/lib/api-client";

type HomeReview = { id: string; userName: string; rating: number; text: string; date: string };

const ORDER_TYPES = [
  { id: "takeaway", label: "takeaway", icon: "shopping-bag" },
  { id: "delivery", label: "delivery", icon: "truck" },
] as const;

const FALLBACK_CATEGORIES = [
  { id: "chicken", labelKey: "chicken", icon: "feather", color: "#BF360C" },
  { id: "burgers", labelKey: "burgers", icon: "circle", color: "#880E4F" },
  { id: "wraps", labelKey: "wraps", icon: "package", color: "#00695C" },
  { id: "sides", labelKey: "sides", icon: "grid", color: "#E65100" },
  { id: "drinks", labelKey: "drinks", icon: "droplet", color: "#0D47A1" },
  { id: "desserts", labelKey: "desserts", icon: "heart", color: "#4A148C" },
] as const;

const CATEGORY_ICONS: Record<string, string> = {
  deals: "tag",
  chicken: "feather",
  burgers: "circle",
  wraps: "package",
  sides: "grid",
  beverages: "droplet",
  drinks: "droplet",
  desserts: "heart",
};

const CATEGORY_COLORS_MAP: Record<string, string> = {
  deals: "#4CAF50",
  chicken: "#BF360C",
  burgers: "#880E4F",
  wraps: "#00695C",
  sides: "#E65100",
  beverages: "#0D47A1",
  drinks: "#0D47A1",
  desserts: "#4A148C",
};

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, availableTier } = useAuth();
  const { menuItems } = useMenu();
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const { orderType, setOrderType } = useOrderType();
  const [apiCategories, setApiCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [homeReviews, setHomeReviews] = useState<HomeReview[]>([]);

  const popularItems = menuItems.filter((i) => i.popular).slice(0, 8);

  const categories = apiCategories.length > 0
    ? apiCategories.map((cat) => ({
        id: cat.slug,
        labelKey: cat.slug,
        icon: CATEGORY_ICONS[cat.slug] || "grid",
        color: CATEGORY_COLORS_MAP[cat.slug] || "#666",
      }))
    : FALLBACK_CATEGORIES;

  const zingerBurger =
    menuItems.find(
      (i) =>
        i.name.toLowerCase().includes("zinger burger") ||
        i.name.toLowerCase().includes("zinger"),
    );
  const promoImageSource = zingerBurger
    ? resolveMenuImageUrl(zingerBurger.imageUrl)
      ? { uri: resolveMenuImageUrl(zingerBurger.imageUrl) }
      : zingerBurger.image
    : undefined;

  const generateDeals = () => {
    const itemsWithOffers = menuItems.filter(
      (item) => item.offerActive && item.offerPercentage,
    );
    return itemsWithOffers.map((item) => ({
      id: `deal-${item.id}`,
      itemId: item.id,
      title: item.name,
      subtitle: item.description,
      price: Math.round(item.price * (1 - (item.offerPercentage || 0) / 100)),
      originalPrice: item.price,
      tag: item.offerLabel || "Special Offer",
      gradientStart: "#0D3B1A",
      gradientEnd: "#1B5E20",
      imageUrl: item.imageUrl || undefined,
      image: item.image,
    }));
  };

  const dealsToShow = generateDeals();

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const promoPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    customFetch<Array<{ id: string; name: string; slug: string }>>("/api/mobile/categories")
      .then((data) => {
        if (data?.length) setApiCategories(data);
      })
      .catch(() => {});

    customFetch<HomeReview[]>("/api/mobile/reviews")
      .then((data) => {
        if (data?.length) setHomeReviews(data.slice(0, 5));
      })
      .catch(() => {});

    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlide, {
        toValue: 0,
        damping: 16,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();
    Animated.timing(contentFade, {
      toValue: 1,
      duration: 700,
      delay: 200,
      useNativeDriver: true,
    }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(promoPulse, {
          toValue: 1.025,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(promoPulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <LinearGradient
      colors={["rgba(26,53,37,0.05)", "rgba(0,98,51,0.03)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
    <View style={[styles.container, { backgroundColor: "transparent" }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.headerBg} />

      <LinearGradient
        colors={["#0D1F15", "#1A3525", "#2D5A3D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topPad + 10 }]}
      >
        <Animated.View
          style={{
            opacity: headerFade,
            transform: [{ translateY: headerSlide }],
          }}
        >
          <View style={styles.headerTop}>
            <View style={styles.brandLogo}>
              <View style={styles.brandLogoMark}>
                <Image
                  source={require("../../assets/images/icon.png")}
                  style={{ width: 30, height: 30, borderRadius: 7 }}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={styles.rfcTitle}>{(settings as any).storeName || "The Hunger Bite Istanbul"}</Text>
                <View style={styles.greetRow}>
                  <View style={styles.openDot} />
                  <Text style={styles.greetText}>
                    {user
                      ? `${language === "ur" ? "ہے" : "Hey,"} ${user.name.split(" ")[0]}${language === "ur" ? " صاحب!" : "!"}`
                      : t("welcomeBack")}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() =>
                user ? (navigation as any).navigate("Profile") : (navigation as any).navigate("Login")
              }
            >
              {user ? (
                user.profilePicUrl ? (
                  <Image
                    source={{ uri: user.profilePicUrl }}
                    style={styles.profileAvatar}
                  />
                ) : (
                  <Text style={styles.profileInitial}>
                    {user.name.charAt(0).toUpperCase()}
                  </Text>
                )
              ) : (
                <Feather name="user" size={18} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.branchSelector}
            onPress={() => {
              const options = [
                { text: "Takeaway", onPress: () => setOrderType("takeaway") },
                { text: "Delivery", onPress: () => setOrderType("delivery") },
                { text: "Cancel", style: "cancel" as const },
              ];
              import("react-native").then(({ Alert }) => {
                Alert.alert(
                  language === "ur" ? "آرڈر کا طریقہ چنیں" : "Select Order Type",
                  language === "ur" ? "آپ کس طرح کا آرڈر دینا چاہتے ہیں؟" : "How would you like to order?",
                  options,
                );
              });
            }}
            activeOpacity={0.8}
          >
            <View style={styles.branchLeft}>
              <View style={styles.pinBox}>
                <Feather name="shopping-bag" size={12} color="#4CAF50" />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.branchLabel}>
                  {language === "ur" ? "آرڈر کا طریقہ" : "Order Type"}
                </Text>
                <Text style={styles.branchName}>
                  {orderType === "delivery"
                    ? language === "ur"
                      ? "ڈیلیوری"
                      : "Delivery"
                    : language === "ur"
                      ? "ٹیک اے وے"
                      : "Takeaway"}
                </Text>
              </View>
            </View>
            <View style={styles.branchChevron}>
              <Feather
                name="chevron-down"
                size={14}
                color="rgba(255,255,255,0.7)"
              />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={{ opacity: contentFade }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === "web" ? 100 : 100 + insets.bottom },
        ]}
      >
        {/* Hero Banner Carousel */}
        <HeroBanner />

        {/* Loyalty Points Banner */}
        {user && availableTier && (
          <TouchableOpacity
            onPress={() => (navigation as any).navigate("Profile")}
            style={[
              styles.loyaltyBanner,
              { backgroundColor: colors.darkGreen },
            ]}
            activeOpacity={0.8}
          >
            <Feather name="star" size={14} color="#FFD700" />
            <Text style={styles.loyaltyBannerText}>
              {language === "ur"
                ? `${user.loyaltyPoints} پوائنٹس • ${availableTier.label} کی چھوٹ دستیاب!`
                : `${user.loyaltyPoints} pts • ${availableTier.label} off available! Tap to use`}
            </Text>
            <Feather name="chevron-right" size={14} color="#FFD700" />
          </TouchableOpacity>
        )}

        {/* Order Type Selector */}
        <View
          style={[
            styles.orderTypeBar,
            { backgroundColor: "#FFFFFF", borderBottomColor: colors.border },
          ]}
        >
          {ORDER_TYPES.map((type) => {
            const isActive = orderType === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                onPress={() => setOrderType(type.id)}
                style={styles.orderTypeBtn}
              >
                <Feather
                  name={type.icon}
                  size={15}
                  color={isActive ? colors.accent : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.orderTypeLabel,
                    {
                      color: isActive ? colors.accent : colors.mutedForeground,
                    },
                  ]}
                >
                  {t(type.label)}
                </Text>
                {isActive && (
                  <Animated.View
                    style={[
                      styles.activeUnderline,
                      { backgroundColor: colors.accent },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Deals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {t("dealsBanner")}
              </Text>
              <Text
                style={[styles.sectionSub, { color: colors.mutedForeground }]}
              >
                {t("dealsSubtitle")}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                (navigation as any).navigate("Menu", { cat: "deals" })
              }
              style={[styles.seeAllBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.seeAllText, { color: colors.accent }]}>
                {t("seeAll")}
              </Text>
              <Feather name="arrow-right" size={12} color={colors.accent} />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScroll}
          >
            {dealsToShow.map((deal, idx) => (
              <Animated.View
                key={deal.id}
                style={{
                  opacity: contentFade,
                  transform: [
                    {
                      translateX: contentFade.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30 + idx * 20, 0],
                      }),
                    },
                  ],
                }}
              >
                <DealCard
                  deal={deal}
                  onPress={(d) => (navigation as any).navigate("Item-Detail", { id: d.itemId })}
                />
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* Popular Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {t("mostPopular")}
              </Text>
              <Text
                style={[styles.sectionSub, { color: colors.mutedForeground }]}
              >
                {t("popularSub")}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate("Menu")}
              style={[styles.seeAllBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.seeAllText, { color: colors.accent }]}>
                {t("seeAll")}
              </Text>
              <Feather name="arrow-right" size={12} color={colors.accent} />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScroll}
          >
            {popularItems.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                onPress={(i: MenuItem) => (navigation as any).navigate("Item-Detail", { id: i.id })}
                horizontal={false}
              />
            ))}
          </ScrollView>
        </View>

        {/* Customer Reviews Carousel */}
        {homeReviews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {language === "ur" ? "گاہکوں کے جائزے" : "Customer Reviews"}
                </Text>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                  {language === "ur" ? "ہمارے گاہک کیا کہہ رہے ہیں" : "What our customers say"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => (navigation as any).navigate("Reviews")}
                style={[styles.seeAllBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.seeAllText, { color: colors.accent }]}>
                  {t("seeAll")}
                </Text>
                <Feather name="arrow-right" size={12} color={colors.accent} />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScroll}
            >
              {homeReviews.map((review) => (
                <TouchableOpacity
                  key={review.id}
                  style={[styles.reviewMiniCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => (navigation as any).navigate("Reviews")}
                  activeOpacity={0.7}
                >
                  <View style={styles.reviewMiniHeader}>
                    <View style={[styles.reviewMiniAvatar, { backgroundColor: colors.primary + "15" }]}>
                      <Text style={[styles.reviewMiniAvatarText, { color: colors.primary }]}>
                        {review.userName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reviewMiniName, { color: colors.foreground }]} numberOfLines={1}>
                        {review.userName}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 2, marginTop: 2 }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Feather
                            key={i}
                            name="star"
                            size={10}
                            color={i <= review.rating ? "#D4AF37" : "#E5E7EB"}
                            style={i <= review.rating ? { fillColor: "#D4AF37" } : undefined}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.reviewMiniText, { color: colors.mutedForeground }]} numberOfLines={3}>
                    {review.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Signature Promo */}
        {zingerBurger && (
          <Animated.View
            style={[
              styles.promoBannerWrapper,
              { transform: [{ scale: promoPulse }] },
            ]}
          >
            <TouchableOpacity
              style={styles.promoBanner}
              onPress={() => (navigation as any).navigate("Item-Detail", { id: zingerBurger.id })}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={["#0D1F15", "#1A3525", "#C8102E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.promoGradient}
              >
                <View style={styles.promoLeft}>
                  <Text style={styles.promoEyebrow}>
                    {language === "ur" ? "ہماری خاص پیشکش" : "Our Signature"}
                  </Text>
                  <Text style={styles.promoTitle}>{zingerBurger.name}</Text>
                  <Text style={styles.promoPrice}>
                    Rs. {zingerBurger.price.toLocaleString()}
                  </Text>
                  <View style={styles.promoOrderBtn}>
                    <Text style={styles.promoOrderBtnText}>
                      {t("orderNow")}
                    </Text>
                    <Feather name="arrow-right" size={12} color="#C8102E" />
                  </View>
                </View>
                <View style={styles.promoRight}>
                  {promoImageSource ? (
                    <Image
                      source={promoImageSource}
                      style={styles.promoImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.promoCircle}>
                      <Feather
                        name="layers"
                        size={36}
                        color="rgba(255,255,255,0.55)"
                      />
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Categories Grid - Bottom */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.foreground,
                paddingHorizontal: 16,
                marginBottom: 14,
              },
            ]}
          >
            {t("browseCategory")}
          </Text>
          <View style={styles.catGrid}>
            {categories.map((cat, idx) => (
              <Animated.View
                key={cat.id}
                style={{
                  opacity: contentFade,
                  transform: [
                    {
                      scale: contentFade.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.85, 1],
                      }),
                    },
                  ],
                  width: "47%",
                  flexGrow: 1,
                }}
              >
                <TouchableOpacity
                  onPress={() =>
                    (navigation as any).navigate("Menu", { cat: cat.id })
                  }
                  style={[
                    styles.catTile,
                    {
                      backgroundColor: "#FFFFFF",
                      borderColor: cat.color + "25",
                    },
                  ]}
                  activeOpacity={0.72}
                >
                  <View
                    style={[
                      styles.catIconBox,
                      { backgroundColor: cat.color + "18" },
                    ]}
                  >
                    <Feather
                      name={cat.icon as any}
                      size={22}
                      color={cat.color}
                    />
                  </View>
                  <Text style={[styles.catLabel, { color: "#1A1A1A" }]}>
                    {t(cat.labelKey as any)}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

      </Animated.ScrollView>
    </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoChip: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
    elevation: 4,
  },
  logoChipText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  brandLogo: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandLogoMark: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0,
    borderColor: "rgba(255,255,255,0.2)",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
    elevation: 4,
  },
  brandLogoIcon: { fontSize: 24, color: "#FFD54F" },
  brandLogoText: {
    color: "#C8102E",
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  profileAvatar: { width: 36, height: 36, borderRadius: 18 },
  rfcTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  greetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4CAF50" },
  greetText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  branchSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    marginTop: 12,
  },
  branchLeft: { flexDirection: "row", alignItems: "center" },
  pinBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  branchLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "Inter_400Regular",
  },
  branchName: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    marginTop: 1,
  },
  branchChevron: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: { paddingTop: 2 },
  loyaltyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 0,
  },
  loyaltyBannerText: {
    flex: 1,
    color: "#FFD700",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  orderTypeBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 4,
  },
  orderTypeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    position: "relative",
  },
  activeUnderline: {
    position: "absolute",
    bottom: 0,
    left: 12,
    right: 12,
    height: 2.5,
    borderRadius: 2,
  },
  orderTypeLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  section: { marginTop: 22 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 20, fontFamily: "Inter_700Bold", lineHeight: 26 },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  seeAllText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  hScroll: { paddingLeft: 16, paddingRight: 8 },
  promoBannerWrapper: { marginHorizontal: 16, marginTop: 22 },
  promoBanner: {
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 6px 12px rgba(200, 16, 46, 0.3)",
    elevation: 8,
  },
  promoGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 22,
    gap: 16,
  },
  promoLeft: { flex: 1 },
  promoEyebrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  promoTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
    lineHeight: 26,
  },
  promoPrice: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 14,
  },
  promoOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  promoOrderBtnText: {
    color: "#C8102E",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  promoRight: { alignItems: "center", justifyContent: "center" },
  promoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  promoImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
  },
  catTile: {
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
    elevation: 3,
  },
  catIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  catLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  reviewMiniCard: {
    width: 260,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginRight: 10,
  },
  reviewMiniHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  reviewMiniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewMiniAvatarText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  reviewMiniName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  reviewMiniText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
});
