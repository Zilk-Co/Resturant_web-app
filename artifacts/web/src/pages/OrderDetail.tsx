import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { customFetch } from "@workspace/api-client-react";
import { ArrowLeft, Clock, MapPin, CheckCircle, ChefHat, Truck, Package, CircleDot } from "lucide-react";

interface OrderItem { name: string; price: number; quantity: number; }
interface ApiOrder { id: string; customerName?: string; customerPhone?: string; items: OrderItem[]; total: number; status: string; orderType: string; createdAt: string; deliveryAddress?: string; estimatedMinutes?: number; paymentMethod?: string; specialInstructions?: string; }
type OrderStatus = "received" | "preparing" | "ready" | "delivered";

const STATUS_FLOW: OrderStatus[] = ["received", "preparing", "ready", "delivered"];

const STATUS_CONFIG: Record<OrderStatus, { icon: any; color: string; bgColor: string; progressColor: string }> = {
  received: { icon: CircleDot, color: "text-amber-600", bgColor: "bg-amber-100", progressColor: "bg-amber-500" },
  preparing: { icon: ChefHat, color: "text-blue-600", bgColor: "bg-blue-100", progressColor: "bg-blue-500" },
  ready: { icon: Package, color: "text-emerald-600", bgColor: "bg-emerald-100", progressColor: "bg-emerald-500" },
  delivered: { icon: Truck, color: "text-gray-500", bgColor: "bg-gray-100", progressColor: "bg-gray-400" },
};

export default function OrderDetail() {
  const params = useParams();
  const id = params.id;
  const { user } = useAuth();
  const { t } = useLanguage();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const fetchOrder = useCallback(async () => {
    const phone = user?.phone || localStorage.getItem("thb_order_phone");
    if (!phone || !id) { setLoading(false); setNotFound(true); return; }
    try {
      const data = await customFetch<ApiOrder[]>(`/api/mobile/orders?phone=${encodeURIComponent(phone)}`);
      const found = data.find((o) => o.id === id);
      if (found) {
        setOrder(found);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id, user?.phone]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (!order || order.status === "delivered") return;
    const interval = setInterval(() => {
      fetchOrder();
    }, 10000);
    return () => clearInterval(interval);
  }, [order, fetchOrder]);

  useEffect(() => {
    if (!order) return;
    const created = new Date(order.createdAt).getTime();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - created) / 60000));
    }, 60000);
    setElapsed(Math.floor((Date.now() - created) / 60000));
    return () => clearInterval(timer);
  }, [order]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] bg-rembrandt"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (notFound || !order) return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-16 text-center bg-rembrandt min-h-[80vh]">
      <p className="text-lg font-medium text-off-white-dim">{t("noResults")}</p>
      <p className="text-sm text-jet-muted mt-2">This order doesn't exist or doesn't belong to your phone number.</p>
      <Link href="/orders" className="mt-4 inline-block text-gold font-medium hover:underline">{t("orders")}</Link>
    </div>
  );

  const currentStatus = (order.status?.toLowerCase() || "received") as OrderStatus;
  const currentIdx = STATUS_FLOW.indexOf(currentStatus);
  const progress = ((currentIdx + 1) / STATUS_FLOW.length) * 100;
  const config = STATUS_CONFIG[currentStatus];
  const StatusIcon = config.icon;

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 bg-rembrandt min-h-screen">
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-off-white-dim hover:text-gold transition-colors mb-6 no-underline">
        <ArrowLeft className="w-4 h-4" /> {t("orders")}
      </Link>

      {/* Live Status Banner */}
      <div className={`${config.bgColor} rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 rounded-2xl ${config.progressColor} flex items-center justify-center`}>
            <StatusIcon className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <p className={`text-lg font-bold ${config.color}`}>{currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}</p>
            <p className="text-sm text-gray-600">
              {currentStatus === "received" && "We've received your order"}
              {currentStatus === "preparing" && "Your food is being prepared"}
              {currentStatus === "ready" && "Ready for pickup!"}
              {currentStatus === "delivered" && "Order delivered successfully"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Elapsed</p>
            <p className="text-lg font-bold text-gray-700">{elapsed}m</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className={`${config.progressColor} h-full rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status Steps */}
        <div className="flex justify-between mt-3">
          {STATUS_FLOW.map((status, idx) => {
            const isCompleted = idx <= currentIdx;
            const isCurrent = idx === currentIdx;
            return (
              <div key={status} className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${isCompleted ? STATUS_CONFIG[status].progressColor : "bg-gray-300"} ${isCurrent ? "ring-2 ring-offset-1 " + STATUS_CONFIG[status].progressColor : ""}`} />
                <p className={`text-xs mt-1 ${isCompleted ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                  {status === "received" ? "Received" : status === "preparing" ? "Preparing" : status === "ready" ? "Ready" : "Delivered"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-jet font-serif">Order #{order.id.slice(-6).toUpperCase()}</h1>
            <p className="text-xs text-jet-muted mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <span className="font-bold text-lg thb-price">Rs. {order.total.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-jet-muted">
          <MapPin className="w-4 h-4 text-crimson" />
          <span>{order.orderType === "delivery" ? t("delivery") : t("takeaway")}</span>
        </div>
        {order.deliveryAddress && <p className="text-sm text-jet-muted mt-2 ml-6">{order.deliveryAddress}</p>}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
        <h2 className="font-semibold text-jet mb-3 font-serif">{t("orderSummary")}</h2>
        <div className="space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-jet-muted w-6 text-right">{item.quantity}x</span>
                <span className="text-jet">{item.name}</span>
              </div>
              <span className="text-jet-muted">Rs. {(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-bold">
          <span className="text-jet">{t("total")}</span>
          <span className="thb-price">Rs. {order.total.toLocaleString()}</span>
        </div>
      </div>

      {order.specialInstructions && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-jet mb-2 font-serif">{t("specialInstructions")}</h2>
          <p className="text-sm text-jet-muted">{order.specialInstructions}</p>
        </div>
      )}

      {currentStatus !== "delivered" && (
        <p className="text-center text-xs text-jet-muted mt-4">Auto-refreshes every 10 seconds</p>
      )}
    </div>
  );
}
