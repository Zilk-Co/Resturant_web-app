import { Shell } from "@/admin/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/admin/ui/card";
import { useState, useEffect } from "react";
import { Users, Shield, ChefHat, Banknote, Truck } from "lucide-react";

interface StaffMember {
  id: string;
  username: string;
  name: string;
  role: "admin" | "manager" | "cashier" | "kitchen" | "delivery";
  active: boolean;
  createdAt: string;
}

const ROLES = [
  { value: "admin", label: "Admin", icon: Shield, color: "bg-purple-100 text-purple-700", permissions: ["all"] },
  { value: "manager", label: "Manager", icon: Users, color: "bg-blue-100 text-blue-700", permissions: ["orders", "menu", "analytics", "staff"] },
  { value: "cashier", label: "Cashier", icon: Banknote, color: "bg-green-100 text-green-700", permissions: ["orders", "menu"] },
  { value: "kitchen", label: "Kitchen", icon: ChefHat, color: "bg-orange-100 text-orange-700", permissions: ["orders"] },
  { value: "delivery", label: "Delivery", icon: Truck, color: "bg-cyan-100 text-cyan-700", permissions: ["orders"] },
];

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newStaff, setNewStaff] = useState({ username: "", name: "", password: "", role: "cashier" as StaffMember["role"] });

  useEffect(() => {
    fetch("/api/admin/staff", {
      headers: { Authorization: `Bearer ${sessionStorage.getItem("admin_token")}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setStaff(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const addStaff = async () => {
    if (!newStaff.username || !newStaff.name || !newStaff.password) return;
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify(newStaff),
      });
      if (res.ok) {
        const member = await res.json();
        setStaff((prev) => [...prev, member]);
        setNewStaff({ username: "", name: "", password: "", role: "cashier" });
        setShowAdd(false);
      }
    } catch {}
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/admin/staff/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify({ active }),
      });
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, active } : s)));
    } catch {}
  };

  const deleteStaff = async (id: string) => {
    try {
      await fetch(`/api/admin/staff/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionStorage.getItem("admin_token")}` },
      });
      setStaff((prev) => prev.filter((s) => s.id !== id));
    } catch {}
  };

  if (isLoading) {
    return (
      <Shell>
        <div className="space-y-4">
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
            <p className="text-muted-foreground mt-1">Manage staff accounts and role-based access.</p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            {showAdd ? "Cancel" : "+ Add Staff"}
          </button>
        </div>

        {showAdd && (
          <Card>
            <CardHeader>
              <CardTitle>Add Staff Member</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input
                    type="text"
                    value={newStaff.username}
                    onChange={(e) => setNewStaff((p) => ({ ...p, username: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="e.g. ahmed_kitchen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="e.g. Ahmed Khan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff((p) => ({ ...p, password: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff((p) => ({ ...p, role: e.target.value as StaffMember["role"] }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={addStaff}
                className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Add Staff Member
              </button>
            </CardContent>
          </Card>
        )}

        {/* Role Legend */}
        <div className="flex flex-wrap gap-3">
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <div key={role.value} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${role.color}`}>
                <Icon className="w-3.5 h-3.5" />
                {role.label}
              </div>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Staff Members</CardTitle>
            <CardDescription>{staff.length} total members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Name</th>
                    <th className="text-left py-3 px-2 font-medium">Username</th>
                    <th className="text-center py-3 px-2 font-medium">Role</th>
                    <th className="text-center py-3 px-2 font-medium">Access</th>
                    <th className="text-center py-3 px-2 font-medium">Status</th>
                    <th className="text-right py-3 px-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-muted/50">
                    <td className="py-3 px-2 font-medium">Admin (You)</td>
                    <td className="py-3 px-2 text-muted-foreground">THB_ADMIN</td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-xs text-muted-foreground">Full Access</td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                    </td>
                    <td className="py-3 px-2 text-right text-xs text-muted-foreground">Primary account</td>
                  </tr>
                  {staff.map((member) => {
                    const roleInfo = ROLES.find((r) => r.value === member.role);
                    return (
                      <tr key={member.id} className="border-b last:border-0">
                        <td className="py-3 px-2 font-medium">{member.name}</td>
                        <td className="py-3 px-2 text-muted-foreground">{member.username}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleInfo?.color || "bg-gray-100 text-gray-700"}`}>
                            {roleInfo && <roleInfo.icon className="w-3 h-3" />}
                            {roleInfo?.label || member.role}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-xs text-muted-foreground">
                          {member.role === "admin" ? "Full Access" : roleInfo?.permissions?.join(", ") || "orders"}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${member.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {member.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleActive(member.id, !member.active)}
                              className="px-2 py-1 rounded text-xs hover:bg-muted"
                            >
                              {member.active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => deleteStaff(member.id)}
                              className="px-2 py-1 rounded text-xs text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
