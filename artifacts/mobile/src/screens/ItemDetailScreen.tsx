import Feather from "react-native-vector-icons/Feather";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ImageCarousel } from "@/components/ImageCarousel";

import { CATEGORY_COLORS } from "@/constants/data";
import { useCart } from "@/contexts/CartContext";
import { useMenu } from "@/contexts/MenuContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { resolveMenuImageUrl } from "@/lib/menuUtils";



// Map category to a light tint colour for the page background accent
const CATEGORY_TINTS: Record<string, string> = {
  burgers: "#FFF3F3",
  chicken: "#FFF8F0",
  wraps: "#F0FBF8",
  sides: "#FFFAF0",
  drinks: "#F0F6FF",
  desserts: "#F8F0FF",
  deals: "#F0FBF0",
};

const CATEGORY_ACCENT: Record<string, string> = {
  burgers: "#C8102E",
  chicken: "#E64A19",
  wraps: "#00897B",
  sides: "#F57C00",
  drinks: "#1565C0",
  desserts: "#7B1FA2",
  deals: "#1B5E20",
};

export default function ItemDetailScreen() {
  const route = useRoute();
  const { id } = route.params as { id: string };
  const paramsId = Array.isArray(id) ? id[0] : id;
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { addItem, getItemQuantity } = useCart();
  const { getItemById, loaded, menuItems } = useMenu();
  const { language } = useLanguage();
  const RECOMMENDED_IDS = ["m7", "m8", "m9", "m10"];

  const item = paramsId ? getItemById(paramsId) : undefined;
  const [quantity, setQuantity] = useState(1);

  const topPad = Platform.OS === "web" ? 12 : insets.top;

  useLayoutEffect(() => {
    if (!loaded) {
      navigation.setOptions({ title: "Loading..." });
    } else if (!item) {
      navigation.setOptions({ title: "Not Found" });
    } else {
      const gradColors = CATEGORY_COLORS[item.category] ?? ["#1B5E20", "#2E7D32"];
      navigation.setOptions({
        title: item.name,
        headerStyle: { backgroundColor: gradColors[0] },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontFamily: "Inter_700Bold", fontSize: 16 },
      });
    }
  }, [loaded, item, navigation]);

  if (!loaded) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background, paddingTop: topPad },
        ]}
      >
        <Feather
          name="alert-circle"
          size={48}
          color={colors.mutedForeground}
        />
        <Text style={[styles.notFoundTitle, { color: colors.foreground }]}>
          Item not found
        </Text>
        <Text
          style={[styles.notFoundDesc, { color: colors.mutedForeground }]}
        >
          Could not load product &quot;{paramsId}&quot;.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.backBtnText}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const gradColors = CATEGORY_COLORS[item.category] ?? ["#1B5E20", "#2E7D32"];
  const pageTint = CATEGORY_TINTS[item.category] ?? "#FAFAFA";
  const pageAccent = CATEGORY_ACCENT[item.category] ?? colors.primary;
  const cartQuantity = getItemQuantity(item.id);
  const hasOffer = item.offerActive && typeof item.offerPercentage === "number" && item.offerPercentage > 0;
  const salePrice = hasOffer ? Math.round(item.price * (1 - (item.offerPercentage || 0) / 100)) : item.price;
  const totalPrice = salePrice * quantity;

  const imageUris =
    item.images?.map(resolveMenuImageUrl).filter((u): u is string => !!u) ?? [];
  if (imageUris.length === 0 && item.imageUrl) {
    const r = resolveMenuImageUrl(item.imageUrl);
    if (r) imageUris.push(r);
  }

  const handleAddToCart = () => {
    const hasOffer = item.offerActive && typeof item.offerPercentage === "number" && item.offerPercentage > 0;
    const salePrice = hasOffer ? Math.round(item.price * (1 - (item.offerPercentage || 0) / 100)) : item.price;
    for (let i = 0; i < quantity; i++) {
      addItem({
        itemId: item.id,
        name: item.name,
        price: salePrice,
        category: item.category,
      });
    }
    navigation.goBack();
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: pageTint }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
      >
        {/* ── Image area ── */}
        <View style={[styles.imageWrapper, { backgroundColor: "#FFFFFF" }]}>
          {imageUris.length > 0 ? (
            <ImageCarousel images={imageUris} height={300} />
          ) : (
            <LinearGradient
              colors={gradColors}
              style={styles.imagePlaceholder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Feather
                name="layers"
                size={56}
                color="rgba(255,255,255,0.5)"
              />
            </LinearGradient>
          )}
          {/* Coloured bottom accent strip */}
          <LinearGradient
            colors={[gradColors[0] + "00", gradColors[0] + "22"]}
            style={styles.imageBottomFade}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </View>

        {/* ── Left accent bar + badges ── */}
        <View style={styles.content}>
          {/* Category accent pill row */}
          <View style={styles.badgeRow}>
            <View style={[styles.catBadge, { backgroundColor: pageAccent }]}>
              <Text style={styles.catBadgeText}>
                {item.category.toUpperCase()}
              </Text>
            </View>
            {item.popular && (
              <View
                style={[styles.badge, { backgroundColor: colors.lightGreen }]}
              >
                <Feather
                  name="trending-up"
                  size={11}
                  color={colors.primary}
                />
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  Popular
                </Text>
              </View>
            )}
            {item.spicy && (
              <View style={[styles.badge, { backgroundColor: "#FFEBEE" }]}>
                <Feather name="zap" size={11} color="#C8102E" />
                <Text style={[styles.badgeText, { color: "#C8102E" }]}>
                  Spicy
                </Text>
              </View>
            )}
            {item.isNew && (
              <View style={[styles.badge, { backgroundColor: "#FFF8E1" }]}>
                <Feather name="star" size={11} color="#F57F17" />
                <Text style={[styles.badgeText, { color: "#F57F17" }]}>
                  New
                </Text>
              </View>
            )}
          </View>

          {/* Name + price card */}
          <View
            style={[
              styles.nameCard,
              { backgroundColor: "#FFFFFF", borderLeftColor: pageAccent },
            ]}
          >
            <Text style={[styles.itemName, { color: colors.foreground }]}>
              {item.name}
            </Text>
            {(() => {
              const hasOffer = item.offerActive && typeof item.offerPercentage === "number" && item.offerPercentage > 0;
              const salePrice = hasOffer ? Math.round(item.price * (1 - (item.offerPercentage || 0) / 100)) : item.price;
              return (
                <View style={styles.priceRow}>
                  <Text style={[styles.itemPrice, { color: pageAccent }]}>
                    Rs. {salePrice.toLocaleString()}
                  </Text>
                  {hasOffer && (
                    <>
                      <Text style={[styles.originalPrice, { color: colors.mutedForeground }]}>
                        Rs. {item.price.toLocaleString()}
                      </Text>
                      <View style={[styles.offerBadge, { backgroundColor: "#C8102E" }]}>
                        <Text style={styles.offerBadgeText}>{item.offerPercentage}% OFF</Text>
                      </View>
                    </>
                  )}
                </View>
              );
            })()}
          </View>

          {/* Description */}
          <Text
            style={[styles.description, { color: colors.mutedForeground }]}
          >
            {item.description || "No description available."}
          </Text>

          {/* Calories */}
          {item.calories ? (
            <View
              style={[
                styles.calorieBox,
                { backgroundColor: "#FFFFFF", borderColor: colors.border },
              ]}
            >
              <Feather name="activity" size={14} color={pageAccent} />
              <Text
                style={[styles.calorieText, { color: colors.foreground }]}
              >
                {item.calories} kcal per serving
              </Text>
            </View>
          ) : null}

          {/* Divider */}
          <View
            style={[styles.divider, { backgroundColor: colors.border }]}
          />

          {/* Quantity */}
          <View style={styles.quantitySection}>
            <Text
              style={[styles.quantityTitle, { color: colors.foreground }]}
            >
              Quantity
            </Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity
                onPress={() => {
                    if (quantity > 1) {
                    setQuantity((q) => q - 1);
                  }
                }}
                style={[
                  styles.qBtn,
                  {
                    backgroundColor:
                      quantity === 1 ? colors.muted : "#FFFFFF",
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather
                  name="minus"
                  size={16}
                  color={
                    quantity === 1
                      ? colors.mutedForeground
                      : colors.foreground
                  }
                />
              </TouchableOpacity>
              <View
                style={[styles.qCountBox, { backgroundColor: pageAccent }]}
              >
                <Text style={styles.qCount}>{quantity}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setQuantity((q) => q + 1);
                }}
                style={[
                  styles.qBtn,
                  { backgroundColor: "#FFFFFF", borderColor: colors.border },
                ]}
              >
                <Feather name="plus" size={16} color={pageAccent} />
              </TouchableOpacity>
            </View>
          </View>

          {cartQuantity > 0 && (
            <View
              style={[
                styles.inCartNotice,
                { backgroundColor: colors.lightGreen },
              ]}
            >
              <Feather name="shopping-bag" size={14} color={colors.primary} />
              <Text style={[styles.inCartText, { color: colors.primary }]}>
                {cartQuantity} already in cart
              </Text>
            </View>
          )}
        </View>

        {/* ── You Might Also Like - Hardcoded add-ons ── */}
        <View style={styles.suggestSection}>
          <LinearGradient
            colors={[pageTint, "#FFFFFF"]}
            style={styles.suggestHeaderBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={styles.suggestHeader}>
            <View
              style={[
                styles.suggestAccentBar,
                { backgroundColor: colors.accent },
              ]}
            />
            <Text
              style={[styles.suggestTitle, { color: colors.foreground }]}
            >
              {language === "ur" ? "آپ کو یہ بھی پسند آ سکتا ہے" : "You Might Also Like"}
            </Text>
          </View>
          <Text
            style={[
              styles.suggestSub,
              { color: colors.mutedForeground, paddingHorizontal: 18, marginBottom: 8 },
            ]}
          >
            {language === "ur" ? "اپنے کھانے کو مکمل کریں" : "Complete your meal"}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestScroll}
          >
            {RECOMMENDED_IDS.map((rid) => {
              const rItem = menuItems.find((m) => m.id === rid);
              if (!rItem) return null;
              const rImageUrl = resolveMenuImageUrl(rItem.imageUrl);
              const rAccent = CATEGORY_ACCENT[rItem.category] ?? colors.primary;
              const rInCart = getItemQuantity(rItem.id);
              const rHasOffer = rItem.offerActive && typeof rItem.offerPercentage === "number" && rItem.offerPercentage > 0;
              const rSalePrice = rHasOffer ? Math.round(rItem.price * (1 - (rItem.offerPercentage || 0) / 100)) : rItem.price;
              return (
                <TouchableOpacity
                  key={rItem.id}
                  style={[
                    styles.suggestCard,
                    {
                      backgroundColor: "#FFFFFF",
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => (navigation as any).navigate("Item-Detail", { id: rItem.id })}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.suggestImgBox,
                      {
                        backgroundColor: CATEGORY_TINTS[rItem.category] ?? "#F5F5F5",
                      },
                    ]}
                  >
                    {rImageUrl ? (
                      <Image
                        source={{ uri: rImageUrl }}
                        style={styles.suggestImg}
                        resizeMode="contain"
                      />
                    ) : (
                      <Feather name="layers" size={28} color={rAccent + "80"} />
                    )}
                  </View>
                  <View style={styles.suggestInfo}>
                    <Text
                      style={[styles.suggestName, { color: colors.foreground }]}
                      numberOfLines={2}
                    >
                      {rItem.name}
                    </Text>
                    <Text style={[styles.suggestCat, { color: rAccent }]}>
                      {rItem.category.charAt(0).toUpperCase() + rItem.category.slice(1)}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[styles.suggestPrice, { color: rAccent }]}>
                        Rs. {rSalePrice.toLocaleString()}
                      </Text>
                      {rHasOffer && (
                        <Text style={{ fontSize: 10, textDecorationLine: "line-through", color: "rgba(0,0,0,0.35)" }}>
                          Rs. {rItem.price.toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.suggestAddBtn,
                      {
                        backgroundColor: rInCart > 0 ? colors.lightGreen : rAccent,
                      },
                    ]}
                    onPress={() => {
                      addItem({
                        itemId: rItem.id,
                        name: rItem.name,
                        price: rSalePrice,
                        category: rItem.category,
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <Feather
                      name={rInCart > 0 ? "check" : "plus"}
                      size={14}
                      color={rInCart > 0 ? colors.primary : "#FFFFFF"}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      {/* ── Sticky Add to Cart footer ── */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: "#FFFFFF",
            borderTopColor: colors.border,
            paddingBottom: bottomPad + 12,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleAddToCart}
          style={[styles.addToCartBtn, { backgroundColor: pageAccent }]}
          activeOpacity={0.88}
        >
          <Feather name="shopping-bag" size={18} color="#FFF" />
          <Text style={styles.addToCartText}>
            Add {quantity > 1 ? `\u00d7${quantity}` : ""} to Cart
          </Text>
          <View style={styles.priceTag}>
            <Text style={styles.priceTagText}>
              Rs. {totalPrice.toLocaleString()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  notFoundTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 8 },
  notFoundDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  backBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },

  imageWrapper: {
    width: "100%",
    height: 300,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  imagePlaceholder: {
    width: "100%",
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  imageBottomFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
  },

  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 4 },

  badgeRow: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 14,
    flexWrap: "wrap",
    alignItems: "center",
  },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  catBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  nameCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  itemName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    lineHeight: 30,
  },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  itemPrice: { fontSize: 26, fontFamily: "Inter_700Bold" },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: "line-through",
    color: "rgba(0,0,0,0.4)",
    marginLeft: 8,
  },
  offerBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  offerBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },

  description: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    marginBottom: 14,
  },

  calorieBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  calorieText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  divider: { height: 1, marginBottom: 18 },

  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  quantityTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  quantityControl: { flexDirection: "row", alignItems: "center", gap: 12 },
  qBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  qCountBox: {
    width: 44,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  qCount: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFFFFF" },

  inCartNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  inCartText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  /* Try This As Well */
  suggestSection: { marginTop: 8 },
  suggestHeaderBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 56,
  },
  suggestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  suggestAccentBar: { width: 4, height: 22, borderRadius: 2 },
  suggestTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  suggestSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  suggestScroll: { paddingHorizontal: 18, paddingBottom: 12, gap: 12 },
  suggestCard: {
    width: 160,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  suggestImgBox: {
    width: "100%",
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestImg: { width: "85%", height: 90 },
  suggestInfo: { padding: 10, paddingBottom: 6 },
  suggestName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 17,
    marginBottom: 3,
  },
  suggestCat: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    marginBottom: 3,
    textTransform: "uppercase",
  },
  suggestPrice: { fontSize: 14, fontFamily: "Inter_700Bold" },
  suggestAddBtn: {
    margin: 10,
    marginTop: 4,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Footer */
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  addToCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  addToCartText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    flex: 1,
    textAlign: "center",
  },
  priceTag: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priceTagText: { color: "#FFFFFF", fontSize: 14, fontFamily: "Inter_700Bold" },
});
