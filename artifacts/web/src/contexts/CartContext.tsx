import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast";

export interface CartItem {
  cartId: string;
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  imageUrl?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "cartId" | "quantity">, qty?: number) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  getItemQuantity: (itemId: string) => number;
}

const CartContext = createContext<CartContextType>(null!);

function loadCart(): CartItem[] {
  try {
    const data = localStorage.getItem("rfc_cart");
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveCart(items: CartItem[]) {
  try { localStorage.setItem("rfc_cart", JSON.stringify(items)); } catch {}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const { showToast } = useToast();
  const pendingToast = useRef<{ type: "success" | "info"; msg: string } | null>(null);

  useEffect(() => { saveCart(items); }, [items]);

  useEffect(() => {
    if (pendingToast.current) {
      const { type, msg } = pendingToast.current;
      pendingToast.current = null;
      showToast(type, msg);
    }
  }, [items, showToast]);

  const addItem = useCallback((item: Omit<CartItem, "cartId" | "quantity">, qty: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.itemId === item.itemId);
      if (existing) {
        const newQty = existing.quantity + qty;
        pendingToast.current = { type: "success", msg: `${item.name} × ${newQty} in cart` };
        return prev.map((i) =>
          i.itemId === item.itemId ? { ...i, quantity: newQty } : i
        );
      }
      pendingToast.current = { type: "success", msg: qty > 1 ? `${item.name} × ${qty} added to cart` : `${item.name} added to cart` };
      const cartId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
      return [...prev, { ...item, cartId, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((cartId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.cartId === cartId);
      if (item) pendingToast.current = { type: "info", msg: `Removed ${item.name} from cart` };
      return prev.filter((i) => i.cartId !== cartId);
    });
  }, []);

  const updateQuantity = useCallback((cartId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => {
        const item = prev.find((i) => i.cartId === cartId);
        if (item) pendingToast.current = { type: "info", msg: `Removed ${item.name} from cart` };
        return prev.filter((i) => i.cartId !== cartId);
      });
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.cartId === cartId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemQuantity = useCallback(
    (itemId: string) => items.find((i) => i.itemId === itemId)?.quantity ?? 0,
    [items]
  );

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount, getItemQuantity }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
