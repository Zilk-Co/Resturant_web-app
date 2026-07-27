import Feather from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LOYALTY_TIERS, useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOrders } from "@/contexts/OrderContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useOrderType } from "@/contexts/OrderTypeContext";
import { useColors } from "@/hooks/useColors";

const PAYMENT_METHODS = [
  {
    id: "cod",
    label: "Cash on Delivery",
    icon: "dollar-sign" as const,
    sub: "Pay when your order arrives",
  },
  {
    id: "card",
    label: "Credit / Debit Card",
    icon: "credit-card" as const,
    sub: "Visa, Mastercard, UnionPay",
  },
  {
    id: "easypaisa",
    label: "Easypaisa",
    icon: "smartphone" as const,
    sub: "Mobile wallet",
  },
  {
    id: "jazzcash",
    label: "JazzCash",
    icon: "smartphone" as const,
    sub: "Mobile wallet",
  },
] as const;

export default function CheckoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { items, total, clearCart } = useCart();
  const { orderType, setOrderType } = useOrderType();
  const { placeOrder } = useOrders();
  const { user, defaultAddress, availableTier, redeemPoints } = useAuth();
  const { settings } = useSettings();
  const { t, language } = useLanguage();

  const [paymentMethod, setPaymentMethod] = useState<
    "cod" | "card" | "easypaisa" | "jazzcash"
  >("cod");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [addressSource, setAddressSource] = useState<"saved" | "custom">(
    "saved",
  );
  const [applyLoyalty, setApplyLoyalty] = useState(false);

  const loyaltyScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (defaultAddress) {
      setDeliveryAddress(defaultAddress.address);
      setAddressSource("saved");
    }
  }, [defaultAddress?.id]);

  useEffect(() => {
    if (applyLoyalty) {
      Animated.sequence([
        Animated.timing(loyaltyScale, {
          toValue: 1.04,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(loyaltyScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [applyLoyalty]);

  const tax = Math.round(total * (settings.taxRate / 100));
  const deliveryCharge = orderType === "delivery" ? settings.deliveryFee : 0;
  const subtotalWithTax = total + tax + deliveryCharge;
  const loyaltyDiscount =
    applyLoyalty && availableTier
      ? Math.round(subtotalWithTax * (availableTier.discount / 100))
      : 0;
  const grandTotal = subtotalWithTax - loyaltyDiscount;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const effectiveAddress =
    addressSource === "saved" && defaultAddress
      ? defaultAddress.address
      : deliveryAddress;
  const canPlace =
    orderType !== "delivery" || effectiveAddress.trim().length > 0;

  const handlePlaceOrder = async () => {
    if (!canPlace || !user) return;
    setIsPlacing(true);

    if (applyLoyalty && availableTier) {
      await redeemPoints(availableTier.points);
    }

    try {
      const order = await placeOrder({
        items,
        total: grandTotal,
        orderType,
        deliveryAddress: effectiveAddress.trim() || undefined,
        loyaltyDiscount: loyaltyDiscount > 0 ? loyaltyDiscount : undefined,
        paymentMethod,
        specialInstructions: specialInstructions.trim() || undefined,
        customerName: user.name,
        customerPhone: user.phone,
      });
      clearCart();
      setIsPlacing(false);
      (navigation as any).replace("Order-Confirm", { orderId: order.id });
    } catch {
      setIsPlacing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 + bottomPad }}
      >
        {user && (
          <View
            style={[styles.greetBanner, { backgroundColor: colors.lightGreen }]}
          >
            <Feather name="user" size={14} color={colors.primary} />
            <Text style={[styles.greetText, { color: colors.primary }]}>
              {language === "ur"
                ? `${user.name} کے طور پر آرڈر`
                : `Ordering as `}
              {language !== "ur" && (
                <Text style={{ fontFamily: "Inter_700Bold" }}>{user.name}</Text>
              )}
            </Text>
          </View>
        )}

        {/* Order Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("orderType")}
          </Text>
          <View
            style={[
              styles.toggleRow,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            {(["takeaway", "delivery"] as const).map((type) => {
              const icons = {
                takeaway: "shopping-bag",
                delivery: "truck",
              } as const;
              const isActive = orderType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setOrderType(type)}
                  style={[
                    styles.toggleBtn,
                    isActive && {
                      backgroundColor:
                        type === "delivery" ? colors.secondary : colors.primary,
                      shadowColor:
                        type === "delivery" ? colors.secondary : colors.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 6,
                      elevation: 4,
                    },
                  ]}
                >
                  <Feather
                    name={icons[type]}
                    size={13}
                    color={isActive ? "#FFF" : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.toggleBtnText,
                      { color: isActive ? "#FFF" : colors.mutedForeground },
                    ]}
                  >
                    {t(type)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Branch */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {language === "ur" ? "آرڈر کی تفصیلات" : "Order Details"}
          </Text>
          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.cardIconBox,
                { backgroundColor: colors.lightGreen },
              ]}
            >
              <Feather name="shopping-bag" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                The Hunger Bite Istanbul
              </Text>
              <Text
                style={[styles.cardSub, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {orderType === "delivery" ? "Delivery" : "Takeaway"}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        {orderType === "delivery" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {language === "ur" ? "ڈیلیوری پتہ" : "Delivery Address"}
            </Text>
            {defaultAddress && (
              <TouchableOpacity
                onPress={() => setAddressSource("saved")}
                style={[
                  styles.addrOption,
                  {
                    backgroundColor:
                      addressSource === "saved"
                        ? colors.lightGreen
                        : colors.card,
                    borderColor:
                      addressSource === "saved"
                        ? colors.primary
                        : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor:
                        addressSource === "saved"
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                >
                  {addressSource === "saved" && (
                    <View
                      style={[
                        styles.radioFill,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.addrOptLabel, { color: colors.primary }]}
                  >
                    {defaultAddress.label} (
                    {language === "ur" ? "ڈیفالٹ" : "Default"})
                  </Text>
                  <Text
                    style={[styles.addrOptText, { color: colors.foreground }]}
                    numberOfLines={2}
                  >
                    {defaultAddress.address}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => (navigation as any).navigate("Add-Address")}>
                  <Text style={[styles.changeLink, { color: colors.accent }]}>
                    {language === "ur" ? "تبدیل کریں" : "Change"}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setAddressSource("custom")}
              style={[
                styles.addrOption,
                {
                  backgroundColor: colors.card,
                  borderColor:
                    addressSource === "custom" ? colors.primary : colors.border,
                  marginTop: defaultAddress ? 8 : 0,
                },
              ]}
            >
              <View
                style={[
                  styles.radio,
                  {
                    borderColor:
                      addressSource === "custom"
                        ? colors.primary
                        : colors.border,
                  },
                ]}
              >
                {addressSource === "custom" && (
                  <View
                    style={[
                      styles.radioFill,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                )}
              </View>
              <Text style={[styles.addrOptLabel, { color: colors.foreground }]}>
                {language === "ur" ? "مختلف پتہ" : "Enter different address"}
              </Text>
            </TouchableOpacity>
            {addressSource === "custom" && (
              <View
                style={[
                  styles.inputCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    marginTop: 8,
                  },
                ]}
              >
                <Feather
                  name="map-pin"
                  size={16}
                  color={colors.primary}
                  style={{ marginTop: 2 }}
                />
                <TextInput
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  placeholder={
                    language === "ur"
                      ? "مکمل پتہ لکھیں..."
                      : "Enter full delivery address..."
                  }
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={3}
                  style={[styles.textArea, { color: colors.foreground }]}
                />
              </View>
            )}
          </View>
        )}

        {/* Loyalty Redemption */}
        {user && availableTier && (
          <View style={styles.section}>
            <Animated.View style={{ transform: [{ scale: loyaltyScale }] }}>
              <TouchableOpacity
                onPress={() => {
                  setApplyLoyalty((v) => !v);
                }}
                style={[
                  styles.loyaltyRow,
                  {
                    backgroundColor: applyLoyalty
                      ? colors.darkGreen
                      : colors.card,
                    borderColor: applyLoyalty ? colors.primary : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.loyaltyIcon,
                    {
                      backgroundColor: applyLoyalty
                        ? "rgba(255,215,0,0.2)"
                        : colors.lightGreen,
                    },
                  ]}
                >
                  <Feather
                    name="star"
                    size={18}
                    color={applyLoyalty ? "#FFD700" : colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.loyaltyRowTitle,
                      { color: applyLoyalty ? "#FFD700" : colors.foreground },
                    ]}
                  >
                    {t("redeemPoints")} ({user.loyaltyPoints} pts)
                  </Text>
                  <Text
                    style={[
                      styles.loyaltyRowSub,
                      {
                        color: applyLoyalty
                          ? "rgba(255,255,255,0.7)"
                          : colors.mutedForeground,
                      },
                    ]}
                  >
                    {language === "ur"
                      ? `${availableTier.points} پوائنٹس استعمال کریں — ${availableTier.label} چھوٹ`
                      : `Use ${availableTier.points} pts for ${availableTier.label} off`}
                  </Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: applyLoyalty ? "#FFD700" : colors.border,
                      backgroundColor: applyLoyalty ? "#FFD700" : "transparent",
                    },
                  ]}
                >
                  {applyLoyalty && (
                    <Feather name="check" size={12} color={colors.darkGreen} />
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("orderSummary")}
          </Text>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {items.map((item) => (
              <View
                key={item.cartId}
                style={[
                  styles.summaryItem,
                  { borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.qtyBox}>
                  <Text style={[styles.qtyText, { color: colors.primary }]}>
                    {item.quantity}×
                  </Text>
                </View>
                <Text
                  style={[styles.summaryName, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text
                  style={[styles.summaryPrice, { color: colors.foreground }]}
                >
                  Rs. {(item.price * item.quantity).toLocaleString()}
                </Text>
              </View>
            ))}
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text
                  style={[styles.totalLabel, { color: colors.mutedForeground }]}
                >
                  {t("subtotal")}
                </Text>
                <Text style={[styles.totalVal, { color: colors.foreground }]}>
                  Rs. {total.toLocaleString()}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text
                  style={[styles.totalLabel, { color: colors.mutedForeground }]}
                >
                  {t("tax")}
                </Text>
                <Text style={[styles.totalVal, { color: colors.foreground }]}>
                  Rs. {tax.toLocaleString()}
                </Text>
              </View>
              {orderType === "delivery" && (
                <View style={styles.totalRow}>
                  <Text
                    style={[
                      styles.totalLabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {t("deliveryFee")}
                  </Text>
                  <Text style={[styles.totalVal, { color: colors.foreground }]}>
                    Rs. {settings.deliveryFee}
                  </Text>
                </View>
              )}
              {loyaltyDiscount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: "#4CAF50" }]}>
                    {language === "ur" ? "لائلٹی چھوٹ" : "Loyalty Discount"}
                  </Text>
                  <Text style={[styles.totalVal, { color: "#4CAF50" }]}>
                    −Rs. {loyaltyDiscount.toLocaleString()}
                  </Text>
                </View>
              )}
              <View
                style={[styles.grandRow, { borderTopColor: colors.border }]}
              >
                <Text style={[styles.grandLabel, { color: colors.foreground }]}>
                  {t("total")}
                </Text>
                <Text style={[styles.grandValue, { color: colors.primary }]}>
                  Rs. {grandTotal.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("payment")}
          </Text>
          <View style={[styles.paymentCard, { borderColor: colors.border }]}>
            {PAYMENT_METHODS.map((pm, idx) => (
              <TouchableOpacity
                key={pm.id}
                onPress={() => setPaymentMethod(pm.id)}
                style={[
                  styles.paymentRow,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: idx < PAYMENT_METHODS.length - 1 ? 1 : 0,
                    backgroundColor:
                      paymentMethod === pm.id ? colors.lightGreen : colors.card,
                  },
                ]}
              >
                <View
                  style={[
                    styles.pmIcon,
                    {
                      backgroundColor:
                        paymentMethod === pm.id ? colors.primary : colors.muted,
                    },
                  ]}
                >
                  <Feather
                    name={pm.icon}
                    size={15}
                    color={
                      paymentMethod === pm.id ? "#FFF" : colors.mutedForeground
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pmLabel, { color: colors.foreground }]}>
                    {pm.label}
                  </Text>
                  <Text
                    style={[styles.pmSub, { color: colors.mutedForeground }]}
                  >
                    {pm.sub}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    {
                      borderColor:
                        paymentMethod === pm.id
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                >
                  {paymentMethod === pm.id && (
                    <View
                      style={[
                        styles.radioFillPm,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Note */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("note")}
          </Text>
          <View
            style={[
              styles.inputCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              placeholder={t("specialRequests")}
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              style={[styles.textArea, { color: colors.foreground }]}
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: bottomPad + 12,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={isPlacing || !canPlace}
          style={[
            styles.placeBtn,
            {
              backgroundColor:
                isPlacing || !canPlace ? colors.mutedForeground : colors.accent,
            },
          ]}
          activeOpacity={0.85}
        >
          <Text style={styles.placeBtnText}>
            {isPlacing
              ? language === "ur"
                ? "آرڈر جا رہا ہے..."
                : "Placing Order..."
              : t("placeOrder")}
          </Text>
          {!isPlacing && (
            <View style={styles.priceChip}>
              <Text style={styles.priceChipText}>
                Rs. {grandTotal.toLocaleString()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  greetBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  greetText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  section: { paddingHorizontal: 16, paddingTop: 18 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 10 },
  toggleRow: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 5,
    borderRadius: 10,
  },
  toggleBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  cardSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  addrOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  radioFill: { width: 10, height: 10, borderRadius: 5 },
  addrOptLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  addrOptText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  changeLink: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textDecorationLine: "underline",
  },
  inputCard: {
    flexDirection: "row",
    gap: 10,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  textArea: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    padding: 0,
    minHeight: 60,
    textAlignVertical: "top",
  },
  loyaltyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  loyaltyIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  loyaltyRowTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  loyaltyRowSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    gap: 8,
  },
  qtyBox: { width: 28, alignItems: "center" },
  qtyText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  summaryName: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  summaryPrice: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  totalsSection: { padding: 14, gap: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  totalVal: { fontSize: 13, fontFamily: "Inter_500Medium" },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 2,
  },
  grandLabel: { fontSize: 16, fontFamily: "Inter_700Bold" },
  grandValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  paymentCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    gap: 12,
  },
  pmIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  pmLabel: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 1 },
  pmSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioFillPm: { width: 10, height: 10, borderRadius: 5 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  placeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
    shadowColor: "#C8102E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  placeBtnText: {
    color: "#FFF",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    flex: 1,
    textAlign: "center",
  },
  priceChip: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  priceChipText: { color: "#FFF", fontSize: 14, fontFamily: "Inter_700Bold" },
});
