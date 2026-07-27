import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { customFetch } from "@/lib/api-client-react";
import { ArrowLeft, Calendar, Clock, Users, CheckCircle } from "lucide-react";

interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  partySize: number;
  status: string;
  createdAt: string;
}

const TIME_SLOTS = [
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM",
];

export default function TableReservation() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || localStorage.getItem("thb_order_phone") || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!phone) return;
    customFetch<Reservation[]>(`/api/mobile/reservations?phone=${encodeURIComponent(phone)}`)
      .then(setReservations)
      .catch(() => {});
  }, [phone]);

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !date || !time) {
      setError("Please fill all fields");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await customFetch("/api/mobile/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          date,
          time,
          partySize,
        }),
      });
      setSuccess(true);
      localStorage.setItem("thb_order_phone", phone.trim());
      setReservations((prev) => [{
        id: `RES${Date.now()}`,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        date,
        time,
        partySize,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      }, ...prev]);
    } catch {
      setError("Failed to reserve table. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-16 text-center bg-rembrandt min-h-screen">
        <div className="w-20 h-20 rounded-full bg-emerald-light/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-light" />
        </div>
        <h1 className="text-2xl font-bold text-white font-serif mb-2">{t("reservationConfirmed")}</h1>
        <p className="text-off-white-dim">Your table has been reserved for {partySize} guests on {date} at {time}</p>
        <button
          onClick={() => { setSuccess(false); setDate(""); setTime(""); setPartySize(2); }}
          className="mt-8 px-6 py-3 rounded-full bg-crimson text-white font-semibold hover:bg-crimson-dark transition-all"
        >
          Make Another Reservation
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 bg-rembrandt min-h-screen">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-off-white-dim hover:text-gold transition-colors mb-6 no-underline">
        <ArrowLeft className="w-4 h-4" /> {t("home")}
      </Link>

      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-gold" />
        </div>
        <h1 className="text-2xl font-bold text-white font-serif">{t("reserveTable")}</h1>
        <p className="text-off-white-dim mt-2">Reserve your table and skip the wait</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("fullName")}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30" placeholder="Your name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("phoneNumber")}</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30" placeholder="03XX-XXXXXXX" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("selectDate")}</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={today} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("partySize")}</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setPartySize(Math.max(1, partySize - 1))} className="w-10 h-10 rounded-xl border border-gray-200 text-lg font-bold hover:bg-gray-50">-</button>
              <span className="text-lg font-bold text-jet w-8 text-center">{partySize}</span>
              <button type="button" onClick={() => setPartySize(Math.min(20, partySize + 1))} className="w-10 h-10 rounded-xl border border-gray-200 text-lg font-bold hover:bg-gray-50">+</button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("selectTime")}</label>
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setTime(slot)}
                className={`py-2 rounded-lg border text-sm font-medium transition-all ${time === slot ? "border-crimson bg-crimson/5 text-crimson" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-crimson">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting || !date || !time}
          className="w-full py-3 rounded-xl bg-crimson text-white font-semibold hover:bg-crimson-dark transition-all shadow-lg shadow-crimson-glow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Reserving..." : t("reserveNow")}
        </button>
      </div>

      {reservations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-jet mb-3 font-serif">{t("myReservations")}</h2>
          <div className="space-y-3">
            {reservations.map((res) => (
              <div key={res.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-jet">{res.date} at {res.time}</p>
                  <p className="text-xs text-gray-500">{res.partySize} guests</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${res.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                  {res.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
