import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ShoppingCart, User, LogOut, Menu as MenuIcon, Package, Home, BookOpen, Star, Download, X, Globe } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface WebsiteContent {
  key: string;
  label: string;
  value: string;
  section: string;
}

const NAV_ITEMS_STATIC = [
  { href: "/", labelKey: "home" as const, icon: Home },
  { href: "/menu", labelKey: "menu" as const, icon: MenuIcon },
  { href: "/story", labelKey: "ourStory" as const, icon: BookOpen },
  { href: "/reviews", labelKey: "contactUs" as const, icon: Star },
  { href: "/orders", labelKey: "orders" as const, icon: Package },
  { href: "/profile", labelKey: "profile" as const, icon: User },
];

function CartIcon() {
  const { itemCount } = useCart();
  return (
    <div className="relative">
      <ShoppingCart className="w-5 h-5" />
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.span
            key={itemCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-crimson text-white text-[10px] font-bold flex items-center justify-center"
          >
            {itemCount > 99 ? "99+" : itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { settings } = useSettings();
  const { language, setLanguage, t } = useLanguage();
  const [location] = useLocation();
  const [footerContent, setFooterContent] = useState<Record<string, string>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/mobile/website-content`)
      .then((r) => r.json())
      .then((data: WebsiteContent[]) => {
        const map: Record<string, string> = {};
        data.forEach((c) => { map[c.key] = c.value; });
        setFooterContent(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-rembrandt">
      <header className="bg-rembrandt/90 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto pl-2 pr-4 md:pl-4 md:pr-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline group shrink-0">
            <motion.span
              whileHover={{ rotate: -5, scale: 1.05 }}
              className="w-9 h-9 rounded-lg bg-gradient-to-br from-crimson to-crimson-dark flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-crimson-glow"
            >
              THB
            </motion.span>
            <span className="hidden sm:inline font-bold text-lg text-white group-hover:text-gold transition-colors font-serif">
              {settings.storeName}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS_STATIC.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium no-underline transition-all ${
                    isActive
                      ? "bg-crimson text-white"
                      : "text-off-white-dim hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLanguage(language === "en" ? "ur" : "en")}
              className="p-2 text-off-white-dim hover:text-gold transition-colors rounded-lg hover:bg-white/5"
              title={language === "en" ? "اردو" : "English"}
            >
              <Globe className="w-5 h-5" />
            </button>
            <Link href="/cart" title="Cart" className="relative p-2 text-off-white-dim hover:text-gold transition-colors">
              <CartIcon />
            </Link>
            {user ? (
              <button
                onClick={signOut}
                className="hidden md:flex items-center gap-1.5 text-sm text-off-white-dim hover:text-crimson transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden md:inline-flex items-center px-4 py-2 rounded-full border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-all no-underline"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="hidden md:inline-flex items-center px-4 py-2 rounded-full bg-crimson text-white text-sm font-semibold hover:bg-crimson-dark transition-all shadow-lg shadow-crimson-glow hover:shadow-crimson no-underline"
                >
                  Sign Up
                </Link>
              </>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title={mobileMenuOpen ? "Close menu" : "Open menu"}
              className="md:hidden p-2 text-off-white-dim hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/5 overflow-hidden"
            >
                <nav className="px-4 py-3 space-y-1">
                  {NAV_ITEMS_STATIC.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-all ${
                          isActive
                            ? "bg-crimson text-white"
                            : "text-off-white-dim hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {t(item.labelKey)}
                      </Link>
                    );
                  })}
                  {!user && (
                    <Link
                      href="/login"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-crimson hover:bg-crimson/10 no-underline"
                    >
                      <User className="w-4 h-4" />
                      Sign In
                    </Link>
                  )}
                  {!user && (
                    <Link
                      href="/signup"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-crimson hover:bg-crimson/10 no-underline"
                    >
                      <User className="w-4 h-4" />
                      Sign Up
                    </Link>
                  )}
                  {user && (
                    <button
                      onClick={signOut}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-crimson hover:bg-crimson/10 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  )}
                </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bg-slate border-t border-white/5 py-10 text-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-crimson to-crimson-dark flex items-center justify-center text-white font-bold text-xs">
                THB
              </span>
              <span className="font-serif font-bold text-white">{settings.storeName}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-off-white-dim">
              {NAV_ITEMS_STATIC.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-gold transition-colors text-xs">
                  {t(item.labelKey)}
                </Link>
              ))}
            </div>
            {(settings as any).appDownloadUrl ? (
              <a
                href={(settings as any).appDownloadUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-crimson text-white font-semibold text-sm hover:bg-crimson-dark transition-all shadow-md no-underline"
              >
                <Download className="w-4 h-4" />
                Get the App
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-light text-jet-muted text-sm">
                <Download className="w-4 h-4" />
                App Coming Soon
              </span>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-off-white-dim text-xs">{footerContent.footer_address || "Sector 4, Naval Colony, Karachi"}</p>
            <p className="text-jet-muted text-xs mt-1">Phone: {footerContent.footer_phone || settings.storePhone}</p>
            {footerContent.footer_email && <p className="text-jet-muted text-xs mt-1">Email: {footerContent.footer_email}</p>}
            <p className="text-jet-muted text-xs mt-3">&copy; {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
