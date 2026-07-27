import React, { createContext, useCallback, useContext, useState } from "react";

type OrderType = "takeaway" | "delivery";

interface OrderTypeContextType {
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
}

const OrderTypeContext = createContext<OrderTypeContextType>({
  orderType: "takeaway",
  setOrderType: () => {},
});

export function OrderTypeProvider({ children }: { children: React.ReactNode }) {
  const [orderType, setOrderTypeState] = useState<OrderType>("takeaway");

  const setOrderType = useCallback((type: OrderType) => {
    setOrderTypeState(type);
  }, []);

  return (
    <OrderTypeContext.Provider value={{ orderType, setOrderType }}>
      {children}
    </OrderTypeContext.Provider>
  );
}

export function useOrderType() {
  return useContext(OrderTypeContext);
}
