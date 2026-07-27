import { Redirect, Route, Switch, useLocation } from "wouter";
import { lazy, Suspense } from "react";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AdminGuard } from "@/admin/AdminGuard";
import AdminNotFound from "@/admin/pages/not-found";
import Home from "@/pages/Home";
import Menu from "@/pages/Menu";
import Story from "@/pages/Story";
import Reviews from "@/pages/Reviews";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Profile from "@/pages/Profile";
import ItemDetail from "@/pages/ItemDetail";
import AdminLogin from "@/pages/AdminLogin";
import QRMenu from "@/pages/QRMenu";
import TableReservation from "@/pages/TableReservation";

const AdminAnalytics = lazy(() => import("@/admin/pages/analytics"));
const AdminBanners = lazy(() => import("@/admin/pages/banners"));
const AdminCategories = lazy(() => import("@/admin/pages/categories"));
const AdminDashboard = lazy(() => import("@/admin/pages/dashboard"));
const AdminDelivery = lazy(() => import("@/admin/pages/delivery"));
const AdminMenu = lazy(() => import("@/admin/pages/menu"));
const AdminOrders = lazy(() => import("@/admin/pages/orders"));
const AdminReviews = lazy(() => import("@/admin/pages/reviews-admin"));
const AdminSettings = lazy(() => import("@/admin/pages/settings"));
const AdminWebsiteContent = lazy(() => import("@/admin/pages/website-content"));
const AdminInventory = lazy(() => import("@/admin/pages/inventory"));
const AdminStaff = lazy(() => import("@/admin/pages/staff"));

function AdminLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

function UserNotFound() {
  const [, setLocation] = useLocation();

  return (
    <Layout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
          <span className="text-4xl">🍽</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white font-serif">Page not found</h1>
        <p className="text-off-white-dim mt-3 max-w-md">The page you are looking for does not exist.</p>
        <button
          onClick={() => setLocation("/")}
          className="mt-8 px-6 py-3 rounded-full bg-crimson text-white font-semibold hover:bg-crimson-dark transition-all shadow-lg shadow-crimson-glow"
        >
          Back to Home
        </button>
      </div>
    </Layout>
  );
}

function AdminFallback() {
  const [location] = useLocation();

  if (location.startsWith("/admin/")) {
    return (
      <AdminGuard>
        <AdminNotFound />
      </AdminGuard>
    );
  }

  return <UserNotFound />;
}

export default function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <Suspense fallback={<AdminLoader />}>
              <Switch>
                <Route path="/"><Layout><Home /></Layout></Route>
                <Route path="/menu"><Layout><Menu /></Layout></Route>
                <Route path="/story"><Layout><Story /></Layout></Route>
                <Route path="/reviews"><Layout><Reviews /></Layout></Route>
                <Route path="/login"><Login /></Route>
                <Route path="/signup"><Signup /></Route>
                <Route path="/cart"><Layout><Cart /></Layout></Route>
                <Route path="/checkout"><Layout><ProtectedRoute><Checkout /></ProtectedRoute></Layout></Route>
                <Route path="/orders"><Layout><ProtectedRoute><Orders /></ProtectedRoute></Layout></Route>
                <Route path="/orders/:id"><Layout><ProtectedRoute><OrderDetail /></ProtectedRoute></Layout></Route>
                <Route path="/profile"><Layout><ProtectedRoute><Profile /></ProtectedRoute></Layout></Route>
                <Route path="/item/:id"><Layout><ItemDetail /></Layout></Route>
              <Route path="/qr-menu"><QRMenu /></Route>
              <Route path="/reserve"><Layout><TableReservation /></Layout></Route>

                <Route path="/admin-login"><AdminLogin /></Route>
                <Route path="/admin"><Redirect to="/admin/dashboard" /></Route>
                <Route path="/admin/"><Redirect to="/admin/dashboard" /></Route>
                <Route path="/admin/dashboard"><AdminGuard><AdminDashboard /></AdminGuard></Route>
                <Route path="/admin/menu"><AdminGuard><AdminMenu /></AdminGuard></Route>
                <Route path="/admin/categories"><AdminGuard><AdminCategories /></AdminGuard></Route>
                <Route path="/admin/banners"><AdminGuard><AdminBanners /></AdminGuard></Route>
                <Route path="/admin/website-content"><AdminGuard><AdminWebsiteContent /></AdminGuard></Route>
                <Route path="/admin/reviews"><AdminGuard><AdminReviews /></AdminGuard></Route>
                <Route path="/admin/orders"><AdminGuard><AdminOrders /></AdminGuard></Route>
                <Route path="/admin/analytics"><AdminGuard><AdminAnalytics /></AdminGuard></Route>
              <Route path="/admin/settings"><AdminGuard><AdminSettings /></AdminGuard></Route>
              <Route path="/admin/delivery"><AdminGuard><AdminDelivery /></AdminGuard></Route>
              <Route path="/admin/inventory"><AdminGuard><AdminInventory /></AdminGuard></Route>
              <Route path="/admin/staff"><AdminGuard><AdminStaff /></AdminGuard></Route>
              <Route path="/admin/qr-menu"><AdminGuard><QRMenu /></AdminGuard></Route>

                <Route><AdminFallback /></Route>
              </Switch>
              </Suspense>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}
