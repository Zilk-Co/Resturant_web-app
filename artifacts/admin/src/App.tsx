import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import Menu from "@/pages/menu";
import Orders from "@/pages/orders";
import Analytics from "@/pages/analytics";
import Categories from "@/pages/categories";
import Settings from "@/pages/settings";
import Banners from "@/pages/banners";
import WebsiteContent from "@/pages/website-content";
import ReviewsAdmin from "@/pages/reviews-admin";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/menu" component={Menu} />
      <Route path="/orders" component={Orders} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/categories" component={Categories} />
      <Route path="/settings" component={Settings} />
      <Route path="/banners" component={Banners} />
      <Route path="/website-content" component={WebsiteContent} />
      <Route path="/reviews" component={ReviewsAdmin} />
      <Route path="/">
        <Redirect to="/menu" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
