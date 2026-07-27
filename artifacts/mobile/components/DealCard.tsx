import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Deal } from "@/constants/data";
import { useColors } from "@/hooks/useColors";
import { resolveMenuImageUrl } from "@/lib/menuUtils";

interface DealCardProps {
  deal: Deal;
  onPress: (deal: Deal) => void;
}

export function DealCard({ deal, onPress }: DealCardProps) {
  const colors = useColors();
  const discount = Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100);
  
  const resolvedImageUrl = resolveMenuImageUrl(deal.imageUrl);
  const imageSource = resolvedImageUrl ? { uri: resolvedImageUrl } : deal.image;

  return (
    <TouchableOpacity
      onPress={() => onPress(deal)}
      activeOpacity={0.9}
      style={styles.container}
    >
      {/* Image Section with Badges Overlaid */}
      <View style={styles.imageSection}>
        {imageSource ? (
          <Image source={imageSource} style={styles.dealImage} resizeMode="cover" />
        ) : null}

        {/* Tag Badge - Top Left */}
        {deal.tag ? (
          <View style={styles.tagBadgeOverlay}>
            <Text style={styles.tagText}>{deal.tag}</Text>
          </View>
        ) : null}

        {/* Discount Badge - Top Right */}
        <View style={styles.discountBadgeOverlay}>
          <Text style={styles.discountText}>{discount}% OFF</Text>
        </View>
      </View>

      {/* Content Section with Gradient */}
      <LinearGradient
        colors={[deal.gradientStart, deal.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.contentSection}
      >
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {deal.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {deal.subtitle}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>Rs. {deal.price.toLocaleString()}</Text>
            <Text style={styles.originalPrice}>
              Rs. {deal.originalPrice.toLocaleString()}
            </Text>
          </View>

          <View style={styles.orderButton}>
            <Text style={styles.orderButtonText}>Order Now</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  imageSection: {
    width: "100%",
    height: 120,
    position: "relative",
    backgroundColor: "#f5f5f5",
  },
  dealImage: {
    width: "100%",
    height: "100%",
  },
  tagBadgeOverlay: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  discountBadgeOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#C8102E",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  contentSection: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  tagText: {
    color: "#C8102E",
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    fontWeight: "bold",
  },
  discountText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "Inter_700Bold",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
    lineHeight: 12,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  price: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  originalPrice: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textDecorationLine: "line-through",
  },
  orderButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
    paddingVertical: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  orderButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
