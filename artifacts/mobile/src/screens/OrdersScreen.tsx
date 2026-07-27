import Feather from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
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
import { Order, OrderStatus, useOrders } from "@/contexts/OrderContext";
import { useColors } from "@/hooks/useColors";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: React.ComponentProps<typeof Feather>["name"] }
> = {
  received: { label: "Order Received", color: "#1565C0", icon: "check-circle" },
  preparing: { label: "Preparing", color: "#E65100", icon: "clock" },
  ready: { label: "Ready for Pickup", color: "#2E7D32", icon: "package" },
  delivered: { label: "Delivered", color: "#757575", icon: "check-square" },
};

const STATUS_STEPS: OrderStatus[] = ["received", "preparing", "ready", "delivered"];

function OrderCard({ order }: { order: Order }) {
  const colors = useColors();
  const statusCfg = STATUS_CONFIG[order.status];
  const stepIndex = STATUS_STEPS.indexOf(order.status);
  const isActive = order.status !== "delivered";
  const date = new Date(order.timestamp);
  const dateStr = date.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });

  return (
    <View
      style={[
        styles.orderCard,
        {
          backgroundColor: colors.card,
          borderColor: isActive ? statusCfg.color : colors.border,
          borderWidth: isActive ? 1.5 : 1,
        },
      ]}
    >
      {/* Card Header */}
      <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.orderId, { color: colors.foreground }]}>Order #{order.id}</Text>
          <Text style={[styles.orderDate, { color: colors.mutedForeground }]}>
            {dateStr} at {timeStr}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + "20" }]}>
          <Feather name={statusCfg.icon} size={12} color={statusCfg.color} />
          <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      {/* Progress Bar - Only for active orders */}
      {isActive && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            {STATUS_STEPS.slice(0, 3).map((step, idx) => (
              <React.Fragment key={step}>
                <View
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: idx <= stepIndex ? statusCfg.color : colors.border,
                      width: idx <= stepIndex ? 14 : 10,
                      height: idx <= stepIndex ? 14 : 10,
                      borderRadius: 7,
                    },
                  ]}
                />
                {idx < 2 && (
                  <View
                    style={[
                      styles.progressLine,
                      { backgroundColor: idx < stepIndex ? statusCfg.color : colors.border },
                    ]}
                  />
                )}
              </React.Fragment>
            ))}
          </View>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, { color: stepIndex >= 0 ? statusCfg.color : colors.mutedForeground }]}>
              Received
            </Text>
            <Text style={[styles.progressLabel, { color: stepIndex >= 1 ? statusCfg.color : colors.mutedForeground }]}>
              Preparing
            </Text>
            <Text style={[styles.progressLabel, { color: stepIndex >= 2 ? statusCfg.color : colors.mutedForeground }]}>
              Ready
            </Text>
          </View>
          <Text style={[styles.etaText, { color: statusCfg.color }]}>
            Est. {order.estimatedMinutes} min
          </Text>
        </View>
      )}

      {/* Order Type */}
      <View style={[styles.cardMeta, { borderTopColor: colors.border }]}>
        <View style={styles.metaItem}>
          <Feather
            name={order.orderType === "delivery" ? "truck" : order.orderType === "dinein" ? "users" : "shopping-bag"}
            size={12}
            color={colors.mutedForeground}
          />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {order.orderType === "delivery" ? "Delivery" : order.orderType === "dinein" ? "Dine In" : "Takeaway"}
          </Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.itemsSection}>
        {order.items.slice(0, 3).map((item) => (
          <Text key={item.cartId} style={[styles.itemLine, { color: colors.foreground }]}>
            {item.quantity}x {item.name}
          </Text>
        ))}
        {order.items.length > 3 && (
          <Text style={[styles.moreItems, { color: colors.mutedForeground }]}>
            +{order.items.length - 3} more items
          </Text>
        )}
      </View>

      {/* Total */}
      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total Paid</Text>
        <Text style={[styles.totalAmount, { color: colors.primary }]}>
          Rs. {order.total.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { orders } = useOrders();
  const [tab, setTab] = useState<"active" | "past">("active");

  const activeOrders = orders.filter((o) => o.status !== "delivered");
  const pastOrders = orders.filter((o) => o.status === "delivered");
  const displayOrders = tab === "active" ? activeOrders : pastOrders;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Toggle */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setTab("active")}
          style={[
            styles.tabBtn,
            tab === "active" && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
          ]}
        >
          <Text
            style={[
              styles.tabLabel,
              { color: tab === "active" ? colors.accent : colors.mutedForeground },
            ]}
          >
            Active
          </Text>
          {activeOrders.length > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.tabBadgeText}>{activeOrders.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("past")}
          style={[
            styles.tabBtn,
            tab === "past" && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
          ]}
        >
          <Text
            style={[
              styles.tabLabel,
              { color: tab === "past" ? colors.accent : colors.mutedForeground },
            ]}
          >
            Past Orders
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayOrders}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? 100 : 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={tab === "active" ? "clock" : "list"}
            title={tab === "active" ? "No active orders" : "No past orders"}
            description={
              tab === "active"
                ? "Place an order to see it tracked here in real time."
                : "Your order history will appear here once you've placed an order."
            }
            actionLabel="Order Now"
            onAction={() => (navigation as any).navigate("Menu")}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  tabBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 14,
    borderBottomWidth: 1,
  },
  orderId: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  progressSection: {
    padding: 14,
    paddingBottom: 8,
  },
  progressBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  progressDot: {
    borderRadius: 7,
  },
  progressLine: {
    flex: 1,
    height: 2,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  progressLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  etaText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  cardMeta: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  itemsSection: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 3,
  },
  itemLine: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  moreItems: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  totalAmount: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
