import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CartItem } from "@/contexts/CartContext";
import { customFetch } from "@/lib/api-client";

export type OrderStatus = "received" | "preparing" | "ready" | "delivered";

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  orderType: "takeaway" | "delivery";
  timestamp: number;
  estimatedMinutes: number;
  deliveryAddress?: string;
  loyaltyDiscount?: number;
}

interface OrderContextType {
  orders: Order[];
  placeOrder: (params: {
    items: CartItem[];
    total: number;
    orderType: "takeaway" | "delivery";
    deliveryAddress?: string;
    loyaltyDiscount?: number;
    paymentMethod?: string;
    specialInstructions?: string;
    customerName: string;
    customerPhone: string;
  }) => Promise<Order>;
  activeOrder: Order | null;
}

const OrderContext = createContext<OrderContextType>({
  orders: [],
  placeOrder: async () => ({} as Order),
  activeOrder: null,
});

function toMobileOrder(apiOrder: any): Order {
  return {
    id: apiOrder.id,
    items: (apiOrder.items || []).map((i: any) => ({
      cartId: `api_${apiOrder.id}_${i.name}`,
      itemId: i.name,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      category: "",
    })),
    total: apiOrder.total,
    status: (apiOrder.status ?? "Received").toLowerCase() as OrderStatus,
    orderType: (apiOrder.orderType ?? "takeaway") as "takeaway" | "delivery",
    timestamp: new Date(apiOrder.createdAt ?? Date.now()).getTime(),
    estimatedMinutes: apiOrder.estimatedMinutes ?? 20,
    deliveryAddress: apiOrder.deliveryAddress ?? undefined,
  };
}

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phoneRef = useRef<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("thb_orders").then((data) => {
      if (data) {
        try {
          setOrders(JSON.parse(data));
        } catch {}
      }
    });
    AsyncStorage.getItem("thb_access_token").then((token) => {
      if (token) {
        customFetch<{ phone: string }>("/api/mobile/auth/me").then((u) => {
          phoneRef.current = u.phone;
          fetchOrders(u.phone);
          pollRef.current = setInterval(() => fetchOrders(u.phone), 10000);
        }).catch(() => {});
      }
    });
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const fetchOrders = useCallback(async (phone: string) => {
    try {
      const apiOrders = await customFetch<any[]>(`/api/mobile/orders?phone=${encodeURIComponent(phone)}`);
      const mapped = apiOrders.map((o: any) => toMobileOrder(o));
      setOrders(mapped);
      AsyncStorage.setItem("thb_orders", JSON.stringify(mapped));
    } catch {}
  }, []);

  const placeOrder = useCallback(async (params: {
    items: CartItem[];
    total: number;
    orderType: "takeaway" | "delivery";
    deliveryAddress?: string;
    loyaltyDiscount?: number;
    paymentMethod?: string;
    specialInstructions?: string;
    customerName: string;
    customerPhone: string;
  }): Promise<Order> => {
    const estimatedMinutes = params.orderType === "delivery" ? 45 : 20;

    const created = await customFetch<any>("/api/mobile/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        orderType: params.orderType,
        items: params.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        total: params.total,
        deliveryAddress: params.deliveryAddress,
        specialInstructions: params.specialInstructions,
        paymentMethod: params.paymentMethod ?? "cod",
      }),
    });

    const newOrder: Order = {
      id: created.id,
      items: params.items,
      total: params.total,
      status: "received",
      orderType: params.orderType,
      timestamp: new Date(created.createdAt ?? Date.now()).getTime(),
      estimatedMinutes,
      deliveryAddress: params.deliveryAddress,
      loyaltyDiscount: params.loyaltyDiscount,
    };

    setOrders((prev) => [newOrder, ...prev]);
    AsyncStorage.setItem("thb_orders", JSON.stringify([newOrder, ...orders]));
    return newOrder;
  }, [orders]);

  const activeOrder = orders.find(
    (o) => o.status !== "delivered"
  ) ?? null;

  return (
    <OrderContext.Provider value={{ orders, placeOrder, activeOrder }}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrders = () => useContext(OrderContext);
