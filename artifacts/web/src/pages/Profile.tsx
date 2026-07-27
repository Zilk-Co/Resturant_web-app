import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useLocation } from "wouter";
import { User, Award, MapPin, Plus, LogOut, Pencil, Trash2, Download } from "lucide-react";

export default function Profile() {
  const { user, signOut, updateProfile, addAddress, removeAddress, updateAddress, defaultAddress, availableTier, redeemPoints } = useAuth();
  const { settings } = useSettings();
  const [, setLocation] = useLocation();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editPhone, setEditPhone] = useState(user?.phone ?? "");
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState<"Home" | "Work" | "Other">("Home");
  const [newAddressText, setNewAddressText] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  if (!user) return null;

  async function handleSaveProfile() { await updateProfile({ name: editName.trim(), phone: editPhone.trim() }); setEditing(false); }
  async function handleAddAddress() { if (!newAddressText.trim()) return; await addAddress({ label: newAddressLabel, address: newAddressText.trim(), isDefault: !defaultAddress }); setNewAddressText(""); setShowAddAddress(false); }
  async function handleRedeem() { if (!availableTier) return; setRedeeming(true); try { await redeemPoints(availableTier.points); } catch {} setRedeeming(false); }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 bg-rembrandt min-h-screen">
      <div className="bg-gradient-to-br from-emerald-deep to-emerald-mid rounded-2xl p-6 text-white mb-6 border border-emerald-light/20">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
            {user.profilePicUrl ? <img src={user.profilePicUrl} alt="" className="w-full h-full rounded-full object-cover" /> : <User className="w-7 h-7 text-gold" />}
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif">{user.name}</h1>
            <p className="text-sm text-off-white/70">{user.phone}</p>
            {user.email && <p className="text-sm text-off-white/50">{user.email}</p>}
          </div>
        </div>
        <div className="mt-4 bg-white/10 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-gold" />
            <div>
              <p className="text-sm font-semibold">{user.loyaltyPoints} Points</p>
              {availableTier ? <p className="text-xs text-off-white/70">{availableTier.label} available</p> : <p className="text-xs text-off-white/50">Earn 50 pts for a discount</p>}
            </div>
          </div>
          {availableTier && <button onClick={handleRedeem} disabled={redeeming} className="px-4 py-1.5 rounded-full bg-gold text-rembrandt text-xs font-bold hover:bg-gold-dim transition-colors disabled:opacity-50">{redeeming ? "..." : "Redeem"}</button>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-jet font-serif">Profile</h2>
          <button onClick={() => editing ? handleSaveProfile() : setEditing(true)} className="text-sm text-crimson font-medium hover:underline">{editing ? "Save" : "Edit"}</button>
        </div>
        {editing ? (
          <div className="space-y-3">
            <input id="profile-name" name="name" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-jet focus:outline-none focus:border-crimson" placeholder="Name" />
            <input id="profile-phone" name="phone" type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-jet focus:outline-none focus:border-crimson" placeholder="Phone" />
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-jet-muted">Name</span><span className="text-jet">{user.name}</span></div>
            <div className="flex justify-between"><span className="text-jet-muted">Phone</span><span className="text-jet">{user.phone}</span></div>
            {user.email && <div className="flex justify-between"><span className="text-jet-muted">Email</span><span className="text-jet">{user.email}</span></div>}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-jet font-serif">Saved Addresses</h2>
          <button onClick={() => setShowAddAddress(!showAddAddress)} className="text-sm text-crimson font-medium flex items-center gap-1 hover:underline"><Plus className="w-3.5 h-3.5" /> Add</button>
        </div>
        {showAddAddress && (
          <div className="mb-4 p-4 bg-matte rounded-xl space-y-3">
            <div className="flex gap-2">
              {(["Home", "Work", "Other"] as const).map((label) => (
                <button key={label} onClick={() => setNewAddressLabel(label)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${newAddressLabel === label ? "bg-crimson text-white" : "bg-white border border-gray-200 text-jet-muted"}`}>{label}</button>
              ))}
            </div>
            <textarea id="new-address" name="address" value={newAddressText} onChange={(e) => setNewAddressText(e.target.value)} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-jet focus:outline-none focus:border-crimson resize-none" placeholder="Full address" />
            <button onClick={handleAddAddress} className="w-full py-2 rounded-full bg-crimson text-white text-sm font-semibold hover:bg-crimson-dark transition-colors">Save Address</button>
          </div>
        )}
        {user.addresses.length === 0 ? <p className="text-sm text-jet-muted">No addresses saved</p> : (
          <div className="space-y-3">
            {user.addresses.map((addr) => (
              <div key={addr.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-crimson/10 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-crimson" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="text-xs font-semibold text-jet">{addr.label}</span>{addr.isDefault && <span className="text-[10px] bg-gold/20 text-gold font-medium px-1.5 py-0.5 rounded">Default</span>}</div>
                  <p className="text-sm text-jet-muted truncate">{addr.address}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => updateAddress(addr.id, { isDefault: true } as any)} className="p-1.5 text-gray-300 hover:text-gold transition-colors" title="Set as default"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeAddress(addr.id)} className="p-1.5 text-gray-300 hover:text-crimson transition-colors" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(settings as any).appDownloadUrl && <a href={(settings as any).appDownloadUrl} className="w-full py-3 rounded-full bg-crimson text-white font-medium text-sm hover:bg-crimson-dark transition-all flex items-center justify-center gap-2 mb-3 shadow-lg shadow-crimson-glow no-underline"><Download className="w-4 h-4" /> Download the App</a>}
      <button onClick={() => { signOut(); setLocation("/"); }} className="w-full py-3 rounded-full border border-gray-200 text-jet-muted font-medium text-sm hover:border-crimson/30 hover:text-crimson transition-all flex items-center justify-center gap-2">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  );
}
