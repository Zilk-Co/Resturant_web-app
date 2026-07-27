import Feather from "react-native-vector-icons/Feather";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CATEGORY_COLORS, MenuItem } from "@/constants/data";
import { useCart } from "@/contexts/CartContext";
import { useColors } from "@/hooks/useColors";

interface FoodCardProps {
  item: MenuItem;
  onPress: (item: MenuItem) => void;
  horizontal?: boolean;
}

import { resolveMenuImageUrl } from "@/lib/menuUtils";

export function FoodCard({ item, onPress, horizontal = false }: FoodCardProps) {
  const colors = useColors();
  const { addItem, getItemQuantity, updateQuantity, items } = useCart();
  const quantity = getItemQuantity(item.id);
  const gradColors = CATEGORY_COLORS[item.category] ?? ["#333", "#555"];

  const handleAdd = () => {
    addItem({
      itemId: item.id,
      name: item.name,
      price: salePrice,
      category: item.category,
    });
  };

  const handleDecrement = () => {
    const cartItem = items.find((i) => i.itemId === item.id);
    if (cartItem) {
      updateQuantity(cartItem.cartId, cartItem.quantity - 1);
    }
  };

  const resolvedImageUrl = resolveMenuImageUrl(item.imageUrl);
  const imageSource = resolvedImageUrl
    ? { uri: resolvedImageUrl }
    : (item.image ?? undefined);
  const hasOffer =
    item.offerActive &&
    typeof item.offerPercentage === "number" &&
    item.offerPercentage > 0;
  const salePrice = hasOffer
    ? Math.round(item.price * (1 - (item.offerPercentage || 0) / 100))
    : item.price;

  if (horizontal) {
    return (
      <TouchableOpacity
        onPress={() => onPress(item)}
        activeOpacity={0.85}
        style={[
          styles.hCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {imageSource ? (
          <View style={styles.hImageContainer}>
            <Image
              source={imageSource}
              style={styles.hImageFull}
              resizeMode="contain"
            />
          </View>
        ) : (
          <LinearGradient
            colors={gradColors}
            style={styles.hImagePlaceholder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="layers" size={28} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        )}
        <View style={styles.hInfo}>
          <View style={styles.badgeRow}>
            {item.popular && (
              <View style={[styles.badge, { backgroundColor: "#E8F5E9" }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  Popular
                </Text>
              </View>
            )}
            {item.spicy && (
              <View style={[styles.badge, { backgroundColor: "#FFEBEE" }]}>
                <Text style={[styles.badgeText, { color: "#C8102E" }]}>
                  Spicy
                </Text>
              </View>
            )}
            {item.isNew && (
              <View style={[styles.badge, { backgroundColor: "#FFF8E1" }]}>
                <Text style={[styles.badgeText, { color: "#F57F17" }]}>
                  New
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[styles.hName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={[styles.hDesc, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
          <View style={styles.hBottom}>
            <View>
              <Text style={[styles.hPrice, { color: colors.primary }]}>
                Rs. {salePrice.toLocaleString()}
              </Text>
              {hasOffer ? (
                <Text style={styles.hOriginalPrice}>
                  Rs. {item.price.toLocaleString()}
                </Text>
              ) : null}
            </View>
            <View style={styles.hActions}>
              {hasOffer ? (
                <View
                  style={[
                    styles.offerBadge,
                    { backgroundColor: "rgba(200,16,46,0.12)" },
                  ]}
                >
                  <Text style={[styles.offerBadgeText, { color: "#C8102E" }]}>
                    {item.offerLabel || `${item.offerPercentage}% OFF`}
                  </Text>
                </View>
              ) : null}
              {quantity > 0 ? (
                <View
                  style={[
                    styles.quantityBadge,
                    { backgroundColor: colors.accent },
                  ]}
                >
                  <Text style={[styles.quantityBadgeText, { color: "#FFF" }]}>
                    {quantity} in cart
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      activeOpacity={0.85}
      style={[
        styles.vCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {imageSource ? (
        <View style={styles.vImageContainer}>
          <Image
            source={imageSource}
            style={styles.vImageFull}
            resizeMode="contain"
          />
        </View>
      ) : (
        <LinearGradient
          colors={gradColors}
          style={styles.vImagePlaceholder}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name="layers" size={24} color="rgba(255,255,255,0.7)" />
        </LinearGradient>
      )}
      <View style={styles.vInfo}>
        <Text
          style={[styles.vName, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <View style={styles.vPriceRow}>
          <Text style={[styles.vPrice, { color: colors.primary }]}>
            Rs. {salePrice.toLocaleString()}
          </Text>
          {hasOffer ? (
            <Text style={styles.vOriginalPrice}>
              Rs. {item.price.toLocaleString()}
            </Text>
          ) : null}
        </View>
        {hasOffer ? (
          <View
            style={[
              styles.offerBadge,
              { backgroundColor: "rgba(200,16,46,0.12)" },
            ]}
          >
            <Text style={[styles.offerBadgeText, { color: "#C8102E" }]}>
              {item.offerLabel || `${item.offerPercentage}% OFF`}
            </Text>
          </View>
        ) : null}
        {quantity > 0 ? (
          <View style={styles.quantityBadgeContainer}>
            <View
              style={[styles.quantityBadge, { backgroundColor: colors.accent }]}
            >
              <Text style={[styles.quantityBadgeText, { color: "#FFF" }]}>
                {quantity} in cart
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hCard: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  hImageContainer: {
    width: 110,
    height: 110,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  hImagePlaceholder: {
    width: 110,
    height: 110,
    justifyContent: "center",
    alignItems: "center",
  },
  hImageFull: {
    width: 100,
    height: 100,
  },
  hImage: {
    width: 80,
    height: 90,
  },
  hInfo: {
    flex: 1,
    padding: 10,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  hName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 3,
  },
  hDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
    marginBottom: 6,
  },
  hBottom: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  hActions: {
    alignItems: "flex-end",
    gap: 6,
  },
  hPrice: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  hOriginalPrice: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(0,0,0,0.5)",
    textDecorationLine: "line-through",
    marginTop: 2,
  },
  offerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  offerBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  vPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  vOriginalPrice: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(0,0,0,0.45)",
    textDecorationLine: "line-through",
  },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  vQuantityControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  qBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  qCount: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    minWidth: 18,
    textAlign: "center",
  },
  quantityBadgeContainer: {
    marginTop: 8,
  },
  quantityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  quantityBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  vCard: {
    width: 162,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  vImageContainer: {
    width: "100%",
    height: 120,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  vImagePlaceholder: {
    width: "100%",
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  vImageFull: {
    width: "90%",
    height: 110,
  },
  vImage: {
    width: "90%",
    height: 80,
  },
  vInfo: {
    padding: 10,
  },
  vName: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
    lineHeight: 16,
  },
  vPrice: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  vAddBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    alignSelf: "flex-start",
  },
});
