import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useLocation } from "wouter";
import { customFetch } from "@workspace/api-client-react";
import { sendOrderConfirmation } from "@/lib/emailService";
import { ArrowLeft, CreditCard, Lock, MapPin, Pencil } from "lucide-react";

export default function Checkout() {
  const { user, defaultAddress, awardPoints } = useAuth();
  const { items, total, clearCart } = useCart();
  const { settings } = useSettings();
  const [, setLocation] = useLocation();
  const [orderType, setOrderType] = useState<"takeaway" | "delivery">("takeaway");
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [deliveryAddress, setDeliveryAddress] = useState(defaultAddress?.address ?? "");
  const [editingAddress, setEditingAddress] = useState(!defaultAddress);

  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  const subtotal = total;
  const isDeliveryFree = settings.freeDeliveryOver > 0 && subtotal >= settings.freeDeliveryOver;
  const deliveryFee = orderType === "delivery" ? (isDeliveryFree ? 0 : (settings.deliveryFee || 0)) : 0;
  const tax = settings.taxRate > 0 ? Math.round(subtotal * (settings.taxRate / 100)) : 0;
  const orderTotal = subtotal + deliveryFee + tax;

  function formatCardNumber(val: string): string {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  function formatExpiry(val: string): string {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 2) return digits.slice(0, 2) + " / " + digits.slice(2);
    return digits;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { setError("Name and phone are required"); return; }
    if (orderType === "delivery" && !deliveryAddress.trim()) { setError("Delivery address is required"); return; }
    if (paymentMethod === "card") {
      const digits = cardNumber.replace(/\s/g, "");
      if (digits.length < 16) { setError("Please enter a valid card number"); return; }
      if (cardExpiry.replace(/\D/g, "").length < 4) { setError("Please enter a valid expiry date"); return; }
      if (cardCvv.length < 3) { setError("Please enter a valid CVV"); return; }
      if (!cardName.trim()) { setError("Please enter the cardholder name"); return; }
    }
    setSubmitting(true); setError("");
    try {
      const created = await customFetch<any>("/api/mobile/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          orderType,
          items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
          subtotal, tax, deliveryFee, total: orderTotal,
          deliveryAddress: orderType === "delivery" ? deliveryAddress.trim() : undefined,
          specialInstructions: specialInstructions.trim() || undefined,
          paymentMethod,
          ...(paymentMethod === "card" ? { cardLast4: cardNumber.replace(/\s/g, "").slice(-4) } : {}),
        }),
      });
      try { await awardPoints(orderTotal); } catch {}
      localStorage.setItem("thb_order_phone", phone.trim());
      sendOrderConfirmation({
        orderId: created.id,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        total: orderTotal,
        orderType,
        deliveryAddress: orderType === "delivery" ? deliveryAddress.trim() : undefined,
        specialInstructions: specialInstructions.trim() || undefined,
      }).catch(() => {});
      clearCart();
      setLocation(`/orders/${created.id}`);
    } catch (err: any) { setError(err?.message || "Failed to place order. Please try again."); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 bg-rembrandt min-h-screen">
      <button onClick={() => setLocation("/cart")} className="flex items-center gap-1.5 text-sm text-off-white-dim hover:text-gold transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Cart
      </button>
      <h1 className="text-2xl font-bold text-gold mb-6 font-serif">Checkout</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
          <h2 className="font-semibold text-jet font-serif">Contact Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label htmlFor="checkout-name" className="block text-xs font-medium text-jet-muted mb-1">Name</label><input id="checkout-name" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-jet focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30" placeholder="Your name" required /></div>
            <div><label htmlFor="checkout-phone" className="block text-xs font-medium text-jet-muted mb-1">Phone</label><input id="checkout-phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-jet focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30" placeholder="03XX-XXXXXXX" required /></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 shadow-sm">
          <h2 className="font-semibold text-jet font-serif">Order Type</h2>
          <div className="flex gap-3">
            {[{ value: "takeaway", label: "Pickup" }, { value: "delivery", label: "Delivery" }].map((opt) => (
              <button key={opt.value} type="button" onClick={() => setOrderType(opt.value as "takeaway" | "delivery")} className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${orderType === opt.value ? "border-crimson bg-crimson/5 text-crimson" : "border-gray-200 text-jet-muted hover:border-gray-300"}`}>{opt.label}</button>
            ))}
          </div>
        </div>

        {orderType === "delivery" && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-jet font-serif">Delivery Address</h2>
              {defaultAddress && !editingAddress && (
                <button type="button" onClick={() => setEditingAddress(true)} className="text-xs text-crimson font-medium flex items-center gap-1 hover:underline">
                  <Pencil className="w-3 h-3" /> Change
                </button>
              )}
            </div>

            {defaultAddress && !editingAddress ? (
              <div className="flex items-start gap-3 p-3 bg-matte rounded-xl">
                <div className="w-8 h-8 rounded-full bg-crimson/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-crimson" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-jet">{defaultAddress.label}</p>
                  <p className="text-sm text-jet-muted">{defaultAddress.address}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  id="delivery-address"
                  name="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-jet focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30 resize-none"
                  placeholder="Enter your full delivery address (area, street, landmark)"
                  required
                />
                {defaultAddress && (
                  <button type="button" onClick={() => { setDeliveryAddress(defaultAddress.address); setEditingAddress(false); }} className="text-xs text-crimson font-medium hover:underline">
                    Use saved address instead
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 shadow-sm">
          <h2 className="font-semibold text-jet font-serif">Payment Method</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "cod", label: "Cash on Delivery", icon: "💵" },
              { value: "easypaisa", label: "EasyPaisa", icon: "📱" },
              { value: "jazzcash", label: "JazzCash", icon: "💳" },
              { value: "card", label: "Card", icon: "💳" },
            ].map((opt) => (
              <button key={opt.value} type="button" onClick={() => setPaymentMethod(opt.value)} className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${paymentMethod === opt.value ? "border-crimson bg-crimson/5 text-crimson" : "border-gray-200 text-jet-muted hover:border-gray-300"}`}>
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>

          {paymentMethod === "easypaisa" && (
            <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-sm text-green-800 font-medium mb-2">EasyPaisa Payment</p>
              <p className="text-xs text-green-600 mb-3">You will be redirected to EasyPaisa to complete the payment.</p>
              <div>
                <label htmlFor="easypaisa-phone" className="block text-xs font-medium text-green-700 mb-1">EasyPaisa Account Number</label>
                <input id="easypaisa-phone" type="tel" className="w-full px-4 py-2.5 rounded-xl border border-green-200 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30" placeholder="03XX-XXXXXXX" />
              </div>
            </div>
          )}

          {paymentMethod === "jazzcash" && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm text-red-800 font-medium mb-2">JazzCash Payment</p>
              <p className="text-xs text-red-600 mb-3">You will be redirected to JazzCash to complete the payment.</p>
              <div>
                <label htmlFor="jazzcash-phone" className="block text-xs font-medium text-red-700 mb-1">JazzCash Account Number</label>
                <input id="jazzcash-phone" type="tel" className="w-full px-4 py-2.5 rounded-xl border border-red-200 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30" placeholder="03XX-XXXXXXX" />
              </div>
            </div>
          )}

          {paymentMethod === "card" && (
            <div className="mt-4 space-y-3 p-4 bg-matte rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-jet-muted" />
                <span className="text-xs font-semibold text-jet-muted uppercase tracking-wider">Card Details</span>
              </div>
              <div>
                <label htmlFor="card-name" className="block text-xs font-medium text-jet-muted mb-1">Cardholder Name</label>
                <input id="card-name" name="cardName" type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-jet bg-white focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30" placeholder="Name on card" />
              </div>
              <div>
                <label htmlFor="card-number" className="block text-xs font-medium text-jet-muted mb-1">Card Number</label>
                <input id="card-number" name="cardNumber" type="text" inputMode="numeric" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-jet bg-white focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30 tracking-widest" placeholder="1234 5678 9012 3456" maxLength={19} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="card-expiry" className="block text-xs font-medium text-jet-muted mb-1">Expiry</label>
                  <input id="card-expiry" name="cardExpiry" type="text" inputMode="numeric" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-jet bg-white focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30" placeholder="MM / YY" maxLength={7} />
                </div>
                <div>
                  <label htmlFor="card-cvv" className="block text-xs font-medium text-jet-muted mb-1">CVV</label>
                  <input id="card-cvv" name="cardCvv" type="password" inputMode="numeric" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-jet bg-white focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30" placeholder="***" maxLength={4} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-jet-muted mt-1">
                <Lock className="w-3 h-3" />
                <span>Your card details are encrypted and secure</span>
              </div>
            </div>
          )}

          {(paymentMethod === "easypaisa" || paymentMethod === "jazzcash") && (
            <p className="text-xs text-jet-muted mt-2 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Secure payment powered by {paymentMethod === "easypaisa" ? "EasyPaisa" : "JazzCash"}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 shadow-sm">
          <h2 className="font-semibold text-jet font-serif">Special Instructions</h2>
          <textarea id="instructions" name="instructions" value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-jet focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30 resize-none" placeholder="Any special requests?" />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-jet-muted"><span>Subtotal ({items.length} items)</span><span className="text-jet">Rs. {subtotal.toLocaleString()}</span></div>
            {settings.taxRate > 0 && <div className="flex justify-between text-sm text-jet-muted mt-2"><span>Tax ({settings.taxRate}%)</span><span className="text-jet">Rs. {tax.toLocaleString()}</span></div>}
            <div className="flex justify-between text-sm text-jet-muted mt-1"><span>Delivery Fee</span><span className="text-jet">{orderType === "delivery" ? (isDeliveryFree ? <span className="text-emerald-light font-medium">Free</span> : `Rs. ${deliveryFee.toLocaleString()}`) : "N/A"}</span></div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base"><span className="text-jet">Total</span><span className="thb-price">Rs. {orderTotal.toLocaleString()}</span></div>
          </div>
        </div>

        {error && <div className="bg-crimson/10 border border-crimson/30 text-crimson text-sm rounded-xl px-4 py-3">{error}</div>}

        <button type="submit" disabled={submitting} className="w-full py-3 rounded-full bg-crimson text-white font-semibold hover:bg-crimson-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-crimson-glow">
          {submitting ? "Placing Order..." : paymentMethod === "card" ? `Pay Rs. ${orderTotal.toLocaleString()}` : `Place Order — Rs. ${orderTotal.toLocaleString()}`}
        </button>
      </form>
    </div>
  );
}
