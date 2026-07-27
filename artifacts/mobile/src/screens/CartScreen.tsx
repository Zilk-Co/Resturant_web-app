import Feather from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { CartItem, useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useOrderType } from "@/contexts/OrderTypeContext";
import { useColors } from "@/hooks/useColors";

function CartItemRow({ item }: { item: CartItem }) {
  const colors = useColors();
  const { updateQuantity } = useCart();

  return (
    <View style={[styles.itemRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.itemIcon, { backgroundColor: colors.lightGreen }]}>
        <Feather name="layers" size={16} color={colors.primary} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.itemUnitPrice, { color: colors.mutedForeground }]}>
          Rs. {item.price.toLocaleString()} each
        </Text>
      </View>
      <View style={styles.itemControls}>
        <TouchableOpacity
          onPress={() => {
            updateQuantity(item.cartId, item.quantity - 1);
          }}
          style={[
            styles.qBtn,
            {
              backgroundColor: item.quantity === 1 ? "#FEE2E2" : colors.muted,
              borderColor: item.quantity === 1 ? "#FECACA" : colors.border,
            },
          ]}
        >
          <Feather
            name={item.quantity === 1 ? "trash-2" : "minus"}
            size={12}
            color={item.quantity === 1 ? "#DC2626" : colors.mutedForeground}
          />
        </TouchableOpacity>
        <Text style={[styles.qCount, { color: colors.foreground }]}>{item.quantity}</Text>
        <TouchableOpacity
          onPress={() => {
            updateQuantity(item.cartId, item.quantity + 1);
          }}
          style={[styles.qBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}
        >
          <Feather name="plus" size={12} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.itemSubtotal, { color: colors.foreground }]}>
          Rs. {(item.price * item.quantity).toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { items, total, itemCount, clearCart } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { orderType, setOrderType } = useOrderType();

  const tax = settings.taxRate > 0 ? Math.round(total * (settings.taxRate / 100)) : 0;
  const effectiveDeliveryFee =
    orderType === "delivery" && settings.freeDeliveryOver > 0 && total >= settings.freeDeliveryOver
      ? 0
      : orderType === "delivery"
        ? (settings.deliveryFee || 0)
        : 0;
  const grandTotal = total + tax + effectiveDeliveryFee;

  const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 60 + insets.bottom;
  const FOOTER_HEIGHT = 88 + (Platform.OS === "web" ? 0 : insets.bottom);

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="shopping-bag"
          title="Your cart is empty"
          description="Add some delicious items from our menu to get started!"
          actionLabel="Browse Menu"
          onAction={() => (navigation as any).navigate("Menu")}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.cartId}
        renderItem={({ item }) => <CartItemRow item={item} />}
        ListHeaderComponent={
          <View style={[styles.listHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.itemCountText, { color: colors.mutedForeground }]}>
              {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
            </Text>
            <TouchableOpacity
              onPress={() => {
                clearCart();
              }}
            >
              <Text style={[styles.clearText, { color: colors.accent }]}>Clear All</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Order Summary</Text>
            <View style={styles.orderTypeRow}>
              {(["takeaway", "delivery"] as const).map((type) => {
                const isActive = orderType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setOrderType(type)}
                    style={[
                      styles.orderTypeBtn,
                      {
                        backgroundColor: isActive ? colors.accent : colors.muted,
                        borderColor: isActive ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Feather
                      name={type === "delivery" ? "truck" : "shopping-bag"}
                      size={14}
                      color={isActive ? "#FFF" : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.orderTypeLabel,
                        { color: isActive ? "#FFF" : colors.mutedForeground },
                      ]}
                    >
                      {type === "delivery" ? "Delivery" : "Takeaway"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Subtotal</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                Rs. {total.toLocaleString()}
              </Text>
            </View>
            {settings.taxRate > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                  Tax {settings.taxRate > 0 ? `(${settings.taxRate}%)` : ""}
                </Text>
                <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                  Rs. {tax.toLocaleString()}
                </Text>
              </View>
            )}
            {orderType === "delivery" && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                  Delivery Fee
                  {settings.freeDeliveryOver > 0 && total >= settings.freeDeliveryOver
                    ? " (Free)"
                    : ""}
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    {
                      color:
                        settings.freeDeliveryOver > 0 && total >= settings.freeDeliveryOver
                          ? "#4CAF50"
                          : colors.foreground,
                    },
                  ]}
                >
                  {settings.freeDeliveryOver > 0 && total >= settings.freeDeliveryOver
                    ? "Free"
                    : `Rs. ${effectiveDeliveryFee.toLocaleString()}`}
                </Text>
              </View>
            )}
            <View style={[styles.totalDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                Rs. {grandTotal.toLocaleString()}
              </Text>
            </View>
          </View>
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: FOOTER_HEIGHT + TAB_BAR_HEIGHT },
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Checkout Footer — sits above tab bar */}
      <View
        style={[
          styles.checkoutFooter,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 16,
            bottom: TAB_BAR_HEIGHT,
          },
        ]}
      >
        {!user && (
          <View style={[styles.loginPrompt, { backgroundColor: colors.lightGreen, borderColor: colors.secondary }]}>
            <Feather name="lock" size={14} color={colors.primary} />
            <Text style={[styles.loginPromptText, { color: colors.primary }]}>
              Sign in required to place an order
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPress={() => {
            if (!user) {
              (navigation as any).navigate("Login");
              return;
            }
            (navigation as any).navigate("Checkout");
          }}
          style={[styles.checkoutBtn, { backgroundColor: colors.accent }]}
          activeOpacity={0.85}
        >
          <Text style={styles.checkoutBtnLabel}>
            {user ? "Proceed to Checkout" : "Sign In to Checkout"}
          </Text>
          <View style={styles.checkoutPriceChip}>
            <Text style={styles.checkoutPriceText}>Rs. {grandTotal.toLocaleString()}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  itemCountText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  clearText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: { flex: 1 },
  itemName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 3,
  },
  itemUnitPrice: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  itemControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  qBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  qCount: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    minWidth: 22,
    textAlign: "center",
  },
  itemSubtotal: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    minWidth: 72,
    textAlign: "right",
  },
  summaryCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 14,
  },
  orderTypeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  orderTypeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  orderTypeLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  totalDivider: {
    height: 1,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  totalValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  checkoutFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  loginPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  loginPromptText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    boxShadow: "0 4px 8px rgba(200, 16, 46, 0.3)",
    elevation: 6,
  },
  checkoutBtnLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  checkoutPriceChip: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  checkoutPriceText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
