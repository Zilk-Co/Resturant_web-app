import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Package, Clock, MapPin } from "lucide-react";

type OrderStatus = "received" | "preparing" | "ready" | "delivered";
interface OrderItem { name: string; price: number; quantity: number; }
interface ApiOrder { id: string; items: OrderItem[]; total: number; status: string; orderType: string; createdAt: string; deliveryAddress?: string; estimatedMinutes?: number; }
interface DisplayOrder { id: string; items: OrderItem[]; total: number; status: OrderStatus; orderType: string; timestamp: number; deliveryAddress?: string; }

function toOrder(api: ApiOrder): DisplayOrder {
  return { id: api.id, items: api.items || [], total: api.total, status: (api.status ?? "Received").toLowerCase() as OrderStatus, orderType: api.orderType ?? "takeaway", timestamp: new Date(api.createdAt ?? Date.now()).getTime(), deliveryAddress: api.deliveryAddress };
}

const STATUS_LABELS: Record<OrderStatus, string> = { received: "Order Received", preparing: "Being Prepared", ready: "Ready", delivered: "Delivered" };
const STATUS_COLORS: Record<OrderStatus, string> = { received: "bg-gold/20 text-gold", preparing: "bg-blue-500/20 text-blue-400", ready: "bg-emerald-light/20 text-emerald-light", delivered: "bg-white/10 text-jet-muted" };

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrders = async (phone: string) => {
    try { const data = await customFetch<ApiOrder[]>(`/api/mobile/orders?phone=${encodeURIComponent(phone)}`); setOrders(data.map(toOrder)); } catch {}
  };

  useEffect(() => {
    const phone = user?.phone || localStorage.getItem("thb_order_phone");
    if (!phone) { setLoading(false); return; }
    fetchOrders(phone).then(() => setLoading(false)).catch(() => setLoading(false));
    pollRef.current = setInterval(() => fetchOrders(phone), 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user?.phone]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] bg-rembrandt"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 text-center bg-rembrandt min-h-[80vh]">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
          <Package className="w-7 h-7 text-off-white-dim" />
        </div>
        <h2 className="text-xl font-bold text-white font-serif">No orders yet</h2>
        <p className="font-['Caveat'] text-lg text-[#CBD5E1] mt-1">your first feast awaits</p>
        <p className="text-off-white-dim mt-1 text-sm font-sans">Your order history will appear here</p>
        <Link href="/menu" className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full bg-crimson text-white font-semibold text-sm hover:bg-crimson-dark transition-all shadow-lg shadow-crimson-glow no-underline">Browse Menu</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 bg-rembrandt min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold text-gold mb-6 font-serif">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <Link key={order.id} href={`/orders/${order.id}`} className="block bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5 hover:border-gold/30 transition-all no-underline">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Order #{order.id.slice(-6).toUpperCase()}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-off-white-dim">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(order.timestamp).toLocaleString()}</span>
                  <span>{order.orderType === "delivery" ? "Delivery" : "Pickup"}</span>
                </div>
                <p className="text-sm text-off-white-dim mt-2">{order.items.slice(0, 3).map((i) => `${i.name} x${i.quantity}`).join(", ")}{order.items.length > 3 && ` +${order.items.length - 3} more`}</p>
              </div>
              <div className="text-right">
                <p className="font-bold thb-price text-gold">Rs. {order.total.toLocaleString()}</p>
                {order.deliveryAddress && <p className="text-[10px] text-off-white-dim mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Delivery</p>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
