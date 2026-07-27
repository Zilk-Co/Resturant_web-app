import { Shell } from "@/admin/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/admin/ui/card";
import { useState, useEffect } from "react";
import { Package, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  available: boolean;
  stock?: number;
  lowStockThreshold?: number;
}

export default function Inventory() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/menu", {
      headers: { Authorization: `Bearer ${sessionStorage.getItem("admin_token")}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : data.value || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const updateStock = async (id: string, stock: number) => {
    try {
      await fetch(`/api/admin/menu/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify({ stock }),
      });
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, stock } : item)));
    } catch {}
  };

  const toggleAvailability = async (id: string, available: boolean) => {
    try {
      await fetch(`/api/admin/menu/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify({ available }),
      });
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, available } : item)));
    } catch {}
  };

  const outOfStock = items.filter((i) => !i.available || (i.stock !== undefined && i.stock <= 0));
  const lowStock = items.filter((i) => i.available && i.stock !== undefined && i.stock > 0 && i.lowStockThreshold !== undefined && i.stock <= i.lowStockThreshold);
  const inStock = items.filter((i) => i.available && (i.stock === undefined || i.stock > (i.lowStockThreshold || 0)));

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground mt-1">Track stock levels and item availability.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inStock.length}</p>
                  <p className="text-sm text-muted-foreground">In Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{lowStock.length}</p>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{outOfStock.length}</p>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Items</CardTitle>
            <CardDescription>Manage stock levels for each item</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Item</th>
                    <th className="text-left py-3 px-2 font-medium">Category</th>
                    <th className="text-center py-3 px-2 font-medium">Stock</th>
                    <th className="text-center py-3 px-2 font-medium">Status</th>
                    <th className="text-right py-3 px-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3 px-2 font-medium">{item.name}</td>
                      <td className="py-3 px-2 text-muted-foreground">{item.category}</td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="number"
                          value={item.stock ?? ""}
                          onChange={(e) => updateStock(item.id, parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-center border rounded-lg text-sm"
                          placeholder="--"
                          min={0}
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        {!item.available ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Unavailable</span>
                        ) : item.stock !== undefined && item.stock <= 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Out of Stock</span>
                        ) : item.stock !== undefined && item.lowStockThreshold !== undefined && item.stock <= item.lowStockThreshold ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Low Stock</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">In Stock</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => toggleAvailability(item.id, !item.available)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${item.available ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                        >
                          {item.available ? "Mark Unavailable" : "Mark Available"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
