import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Link, useLocation } from "wouter";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";

export default function Cart() {
  const { items, updateQuantity, removeItem, total, itemCount, clearCart } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [, setLocation] = useLocation();
  const subtotal = total;
  const deliveryFee = settings.deliveryFee || 0;
  const tax = settings.taxRate > 0 ? Math.round(subtotal * (settings.taxRate / 100)) : 0;
  const orderTotal = subtotal + deliveryFee + tax;

    if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 text-center bg-rembrandt min-h-[80vh]">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-7 h-7 text-off-white-dim" />
        </div>
        <h2 className="text-xl font-bold text-white font-serif">Your cart is empty</h2>
        <p className="text-off-white-dim mt-2 text-sm">Add items from our menu to get started</p>
        <Link href="/menu" className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full bg-crimson text-white font-semibold text-sm hover:bg-crimson-dark transition-all shadow-lg shadow-crimson-glow no-underline">Browse Menu</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 bg-rembrandt min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gold font-serif">Your Cart</h1>
          <p className="text-sm text-off-white-dim mt-0.5">{itemCount} {itemCount === 1 ? "item" : "items"}</p>
        </div>
        <button onClick={clearCart} className="text-sm text-off-white-dim hover:text-crimson transition-colors">Clear All</button>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.cartId} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 flex items-center gap-4 hover:border-white/20 transition-colors">
            <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
              {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" /> : (
                <svg className="w-6 h-6 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-1.1 0-2-.45-2-1s.9-1 2-1 2 .45 2 1-.9 1-2 1zm-4-4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm8 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" /></svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm truncate">{item.name}</h3>
              <p className="text-xs text-off-white-dim mt-0.5">Rs. {item.price.toLocaleString()} each</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 border border-white/10">
                <button onClick={() => updateQuantity(item.cartId, item.quantity - 1)} title="Decrease quantity" className="w-6 h-6 rounded-full text-off-white-dim flex items-center justify-center hover:bg-crimson hover:text-white transition-colors"><Minus className="w-3 h-3" /></button>
                <span className="font-semibold text-sm text-white min-w-[1.2rem] text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.cartId, item.quantity + 1)} title="Increase quantity" className="w-6 h-6 rounded-full text-off-white-dim flex items-center justify-center hover:bg-crimson hover:text-white transition-colors"><Plus className="w-3 h-3" /></button>
              </div>
              <div className="text-right min-w-[5rem]"><p className="font-bold thb-price text-sm text-gold">Rs. {(item.price * item.quantity).toLocaleString()}</p></div>
              <button onClick={() => removeItem(item.cartId)} title="Remove item" className="p-2 text-white/30 hover:text-crimson transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-off-white-dim"><span>Subtotal</span><span className="text-white">Rs. {subtotal.toLocaleString()}</span></div>
          {settings.taxRate > 0 && <div className="flex justify-between text-sm text-off-white-dim mt-2"><span>Tax ({settings.taxRate}%)</span><span className="text-white">Rs. {tax.toLocaleString()}</span></div>}
          <div className="flex justify-between text-sm text-off-white-dim mt-1"><span>Delivery Fee</span><span className="text-white">Rs. {deliveryFee.toLocaleString()}</span></div>
          <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-base"><span className="text-white">Total</span><span className="thb-price text-gold">Rs. {orderTotal.toLocaleString()}</span></div>
        </div>
        <button onClick={() => setLocation("/checkout")} className="mt-4 w-full py-3 rounded-full bg-crimson text-white font-semibold hover:bg-crimson-dark transition-all shadow-lg shadow-crimson-glow">
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
