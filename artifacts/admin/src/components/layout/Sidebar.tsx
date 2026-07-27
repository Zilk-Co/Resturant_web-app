import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Menu as MenuIcon,
  ReceiptText,
  BarChart3,
  LogOut,
  Tag,
  Settings2,
  Monitor,
  Globe,
  Smartphone,
  ShoppingBag,
  Layout,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

type NavGroup = {
  title: string;
  icon: typeof Smartphone;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: "Both App & Website",
    icon: Layout,
    items: [
      { href: "/menu", label: "Menu Management", icon: MenuIcon },
      { href: "/categories", label: "Categories", icon: Tag },
    ],
  },
  {
    title: "App Only",
    icon: Smartphone,
    items: [
      { href: "/banners", label: "Banner Management", icon: Monitor },
    ],
  },
  {
    title: "Website Only",
    icon: Globe,
    items: [
      { href: "/website-content", label: "Website Content", icon: Layout },
      { href: "/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    title: "Operations",
    icon: ShoppingBag,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/orders", label: "Live Orders", icon: ReceiptText },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/settings", label: "Settings", icon: Settings2 },
    ],
  },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex flex-col w-64 border-r bg-sidebar text-sidebar-foreground h-screen sticky top-0 shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="bg-destructive text-destructive-foreground p-2 rounded-md font-bold text-xl leading-none">
            THB
          </div>
          <div>
            <h2 className="font-bold tracking-tight text-lg leading-tight">
              Admin
            </h2>
            <p className="text-xs text-sidebar-foreground/60 font-medium">
              Operations Center
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="flex items-center gap-2 text-xs font-semibold text-red-400 mb-2 px-3 uppercase tracking-wider">
              <group.icon className="h-3 w-3 text-red-400" />
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                      data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 mt-auto border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground gap-3"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
