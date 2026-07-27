import { Shell } from "@/admin/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/admin/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { format, subMonths, startOfMonth, startOfYear } from "date-fns";
import { useState, useEffect } from "react";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Analytics() {
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [quickRange, setQuickRange] = useState<string>("all");
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleQuickRange = (range: string) => {
    setQuickRange(range);
    const today = format(new Date(), "yyyy-MM-dd");
    switch (range) {
      case "month":
        setDateRange({ start: format(startOfMonth(new Date()), "yyyy-MM-dd"), end: today });
        break;
      case "3months":
        setDateRange({ start: format(startOfMonth(subMonths(new Date(), 3)), "yyyy-MM-dd"), end: today });
        break;
      case "year":
        setDateRange({ start: format(startOfYear(new Date()), "yyyy-MM-dd"), end: today });
        break;
      default:
        setDateRange({ start: "", end: "" });
    }
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (dateRange.start) params.set("startDate", dateRange.start);
      if (dateRange.end) params.set("endDate", dateRange.end);
      const query = params.toString();
      const response = await fetch(`/api/admin/analytics${query ? `?${query}` : ""}`);
      const data = await response.json();
      setAnalytics(data);
      setIsLoading(false);
    };
    fetchAnalytics();
  }, [dateRange]);

  if (isLoading) {
    return (
      <Shell>
        <div className="space-y-4">
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-96 bg-muted rounded-xl animate-pulse" />
            <div className="h-96 bg-muted rounded-xl animate-pulse" />
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep dive into operations and revenue.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border">
          <span className="text-sm font-medium text-muted-foreground">Quick Range:</span>
          {[
            { key: "month", label: "This Month" },
            { key: "3months", label: "Last 3 Months" },
            { key: "year", label: "This Year" },
            { key: "all", label: "All Time" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleQuickRange(opt.key)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                quickRange === opt.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-muted-foreground">From:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => {
                setDateRange((prev) => ({ ...prev, start: e.target.value }));
                setQuickRange("");
              }}
              className="px-3 py-1.5 text-sm border rounded-md bg-background text-foreground"
            />
            <label className="text-sm text-muted-foreground">To:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => {
                setDateRange((prev) => ({ ...prev, end: e.target.value }));
                setQuickRange("");
              }}
              className="px-3 py-1.5 text-sm border rounded-md bg-background text-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend (30 Days)</CardTitle>
              <CardDescription>Daily revenue performance</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.dailyRevenue || []}>
                  <defs>
                    <linearGradient id="colorRevenue2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => format(new Date(val), "MMM d")}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `Rs ${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [`Rs ${value}`, "Revenue"]}
                    labelFormatter={(label) => format(new Date(label), "MMMM d, yyyy")}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue2)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orders by Category</CardTitle>
              <CardDescription>Distribution of order volume across menu categories</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.categoryBreakdown || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="orders"
                    nameKey="category"
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                  >
                    {(analytics?.categoryBreakdown || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number, name: string) => [value, "Orders"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue by Category</CardTitle>
              <CardDescription>Total revenue generated per category</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.categoryBreakdown || []}>
                  <XAxis 
                    dataKey="category" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `Rs ${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [`Rs ${value}`, "Revenue"]}
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg Order Value</p>
              <p className="text-2xl font-bold mt-1">Rs {analytics?.totalOrders ? Math.round(analytics.totalRevenue / analytics.totalOrders) : 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Top Category</p>
              <p className="text-2xl font-bold mt-1">{analytics?.categoryBreakdown?.length ? analytics.categoryBreakdown.reduce((a: any, b: any) => a.orders > b.orders ? a : b, analytics.categoryBreakdown[0]).category : "N/A"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Busiest Day</p>
              <p className="text-2xl font-bold mt-1">{analytics?.dailyRevenue?.length ? format(new Date(analytics.dailyRevenue.reduce((a: any, b: any) => a.orders > b.orders ? a : b, analytics.dailyRevenue[0]).date), "EEE") : "N/A"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Revenue / Day</p>
              <p className="text-2xl font-bold mt-1">Rs {analytics?.dailyRevenue?.length ? Math.round(analytics.totalRevenue / analytics.dailyRevenue.filter((d: any) => d.orders > 0).length || 1) : 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Items */}
        {analytics?.topItems?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
              <CardDescription>Most ordered items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topItems.slice(0, 5).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground w-6">#{idx + 1}</span>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{item.quantity} sold</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Shell>
  );
}
