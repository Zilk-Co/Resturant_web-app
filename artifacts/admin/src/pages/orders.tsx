import { Shell } from "@/components/layout/Shell";
import { useState, useMemo } from "react";
import { useListAdminOrders, useUpdateAdminOrderStatus, getListAdminOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isValid, parseISO } from "date-fns";
import { CheckCircle2, XCircle, Clock, ChefHat, Search, MapPin, Truck, BellRing, PackageSearch, Activity, Inbox, Utensils } from "lucide-react";

export default function Orders() {
  const { data: orders, isLoading } = useListAdminOrders();
  const updateStatus = useUpdateAdminOrderStatus();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminOrdersQueryKey() });
        }
      }
    );
  };

  const parseOrderCreatedAt = (value: string) => {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : undefined;
  };

  const formatOrderTime = (value: string) => {
    const date = parseOrderCreatedAt(value);
    return date ? format(date, "h:mm a") : "Unknown time";
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      const matchesSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase()) || o.customerPhone.includes(search);
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const aDate = parseOrderCreatedAt(a.createdAt);
      const bDate = parseOrderCreatedAt(b.createdAt);
      return (bDate?.getTime() ?? 0) - (aDate?.getTime() ?? 0);
    });
  }, [orders, search, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Received': return 'bg-blue-500/15 text-blue-700 border-blue-500/30';
      case 'Preparing': return 'bg-orange-500/15 text-orange-700 border-orange-500/30';
      case 'Ready': return 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30';
      case 'Delivered': return 'bg-primary/15 text-primary border-primary/30';
      case 'Cancelled': return 'bg-destructive/15 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Received': return <Inbox className="w-4 h-4 mr-1.5" />;
      case 'Preparing': return <ChefHat className="w-4 h-4 mr-1.5" />;
      case 'Ready': return <PackageSearch className="w-4 h-4 mr-1.5" />;
      case 'Delivered': return <CheckCircle2 className="w-4 h-4 mr-1.5" />;
      case 'Cancelled': return <XCircle className="w-4 h-4 mr-1.5" />;
      default: return <Activity className="w-4 h-4 mr-1.5" />;
    }
  };

  if (isLoading) {
    return (
      <Shell>
        <div className="space-y-6">
          <div className="h-10 w-64 bg-muted rounded animate-pulse" />
          <div className="h-16 w-full bg-muted rounded animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />)}
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col gap-8 h-full pb-10">
        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">Live Orders</h1>
            <p className="text-muted-foreground mt-1">Monitor, manage, and dispatch customer orders.</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 font-semibold">
              {orders?.filter(o => o.status === 'Received').length || 0} Received
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 px-3 py-1 font-semibold">
              {orders?.filter(o => o.status === 'Preparing').length || 0} Preparing
            </Badge>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card border rounded-xl shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search by customer name, phone, or order ID..." 
              className="pl-10 h-11 border-muted-foreground/20 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-orders"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-11 border-muted-foreground/20" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Received">Received</SelectItem>
              <SelectItem value="Preparing">Preparing</SelectItem>
              <SelectItem value="Ready">Ready</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-6 overflow-y-auto">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-dashed rounded-xl h-64">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Utensils className="w-8 h-8 text-primary/60" />
              </div>
              <h3 className="text-xl font-bold text-foreground">No orders found</h3>
              <p className="text-muted-foreground mt-2 max-w-md">No orders match your current filters. Adjust your search criteria to see more.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  
                  {/* Order Info Section */}
                  <div className="p-6 flex-1 border-b lg:border-b-0 lg:border-r">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-sm font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded">#{order.id.slice(0, 8)}</span>
                          <Badge variant="outline" className={`uppercase text-[11px] tracking-wider font-bold border-2 ${order.orderType === 'delivery' ? 'text-purple-700 border-purple-200 bg-purple-50' : 'text-teal-700 border-teal-200 bg-teal-50'}`}>
                            {order.orderType === 'delivery' ? <Truck className="w-3 h-3 mr-1" /> : <MapPin className="w-3 h-3 mr-1" />}
                            {order.orderType}
                          </Badge>
                          <Badge className={`px-3 py-1 font-bold text-[13px] shadow-none ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {order.status}
                          </Badge>
                        </div>
                        <h3 className="font-black text-2xl text-foreground mt-2">{order.customerName}</h3>
                        <div className="text-lg font-medium text-muted-foreground">{order.customerPhone}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-2xl text-primary">Rs {order.total}</div>
                        <div className="text-sm font-medium text-muted-foreground mt-1 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {formatOrderTime(order.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Order Items</h4>
                      <ul className="space-y-2">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-sm">
                            <span className="font-bold bg-primary/10 text-primary w-6 h-6 flex items-center justify-center rounded text-xs">{item.quantity}x</span>
                            <span className="font-semibold">{item.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="p-6 lg:w-72 bg-muted/10 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Pipeline Status</h4>
                      
                      {/* Pipeline Visualization */}
                      <div className="flex flex-col gap-1 mb-6 relative">
                        <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-muted-foreground/20 rounded-full" />
                        
                        {[
                          { status: 'Received', label: 'Order Received' },
                          { status: 'Preparing', label: 'Preparing Food' },
                          { status: 'Ready', label: 'Ready for Pickup' },
                          { status: 'Delivered', label: 'Delivered' }
                        ].map((step, idx) => {
                          const isCurrent = order.status === step.status;
                          const isPast = ['Received', 'Preparing', 'Ready', 'Delivered'].indexOf(order.status) > idx;
                          const isCancelled = order.status === 'Cancelled';
                          
                          if (isCancelled && idx > 0) return null; // Don't show full pipeline if cancelled early
                          
                          return (
                            <div key={step.status} className="flex items-center gap-3 relative z-10 py-1">
                              <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 transition-colors ${
                                isCancelled ? 'bg-destructive border-destructive text-white' :
                                isCurrent ? 'bg-primary border-primary text-white scale-110 shadow-sm' :
                                isPast ? 'bg-primary border-primary text-white' :
                                'bg-card border-muted-foreground/30 text-transparent'
                              }`}>
                                {(isPast || isCurrent || isCancelled) && <CheckCircle2 className={`w-3.5 h-3.5 ${isCancelled ? 'hidden' : ''}`} />}
                                {isCancelled && <XCircle className="w-3.5 h-3.5" />}
                              </div>
                              <span className={`text-sm font-semibold ${
                                isCurrent ? 'text-foreground' :
                                isPast ? 'text-foreground/70' :
                                'text-muted-foreground/50'
                              }`}>
                                {isCancelled && isCurrent ? 'Order Cancelled' : step.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {order.status === 'Received' && (
                        <>
                          <Button size="lg" className="w-full font-bold bg-orange-600 hover:bg-orange-700 text-white" onClick={() => handleUpdateStatus(order.id, 'Preparing')} data-testid={`btn-prepare-${order.id}`}>
                            <ChefHat className="w-4 h-4 mr-2" /> Start Preparing
                          </Button>
                          <Button size="lg" variant="outline" className="w-full text-destructive border-destructive/50 hover:bg-destructive/10" onClick={() => handleUpdateStatus(order.id, 'Cancelled')}>
                            Cancel Order
                          </Button>
                        </>
                      )}
                      {order.status === 'Preparing' && (
                        <>
                          <Button size="lg" className="w-full font-bold bg-yellow-500 hover:bg-yellow-600 text-yellow-950" onClick={() => handleUpdateStatus(order.id, 'Ready')} data-testid={`btn-ready-${order.id}`}>
                            <PackageSearch className="w-4 h-4 mr-2" /> Mark Ready
                          </Button>
                          <Button size="lg" variant="outline" className="w-full text-destructive border-destructive/50 hover:bg-destructive/10" onClick={() => handleUpdateStatus(order.id, 'Cancelled')}>
                            Cancel Order
                          </Button>
                        </>
                      )}
                      {order.status === 'Ready' && (
                        <Button size="lg" className="w-full font-bold bg-primary hover:bg-primary/90 text-white" onClick={() => handleUpdateStatus(order.id, 'Delivered')} data-testid={`btn-deliver-${order.id}`}>
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Delivered
                        </Button>
                      )}

                      {/* Manual override dropdown for edge cases */}
                      <div className="pt-2 border-t mt-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Manual Override</label>
                        <Select value={order.status} onValueChange={(val) => handleUpdateStatus(order.id, val)}>
                          <SelectTrigger className="w-full h-8 text-xs bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Received">Received</SelectItem>
                            <SelectItem value="Preparing">Preparing</SelectItem>
                            <SelectItem value="Ready">Ready</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Shell>
  );
}
