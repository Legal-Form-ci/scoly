import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import ProductDetail from "./pages/ProductDetail";
import Actualites from "./pages/Actualites";
import ArticleDetail from "./pages/ArticleDetail";
import WriteArticle from "./pages/WriteArticle";
import TeamDashboard from "./pages/TeamDashboard";
import AuthorDashboard from "./pages/AuthorDashboard";
import FAQ from "./pages/FAQ";
import ArticlePayment from "./pages/ArticlePayment";
import ScIA from "./components/ScIA";
import NotFound from "./pages/NotFound";
import BootstrapAdmin from "./pages/BootstrapAdmin";
import ModeratorDashboard from "./pages/ModeratorDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import PushNotificationPrompt from "./components/PushNotificationPrompt";
import SystemDatabase from "./pages/SystemDatabase";
import SystemRepository from "./pages/SystemRepository";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/boutique" element={<Shop />} />
                  <Route path="/shop/product/:id" element={<ProductDetail />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/panier" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/a-propos" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/compte" element={<Account />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/actualites" element={<Actualites />} />
                  <Route path="/actualites/write" element={<WriteArticle />} />
                  <Route path="/actualites/edit/:id" element={<WriteArticle />} />
                  <Route path="/actualites/:id" element={<ArticleDetail />} />
                  <Route path="/team" element={<TeamDashboard />} />
                  <Route path="/author" element={<AuthorDashboard />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/article/pay/:id" element={<ArticlePayment />} />
                  <Route path="/bootstrap-admin" element={<BootstrapAdmin />} />
                  <Route path="/delivery" element={<DeliveryDashboard />} />
                  <Route path="/moderator" element={<ModeratorDashboard />} />
                  <Route path="/vendor" element={<VendorDashboard />} />
                  {/* Isolated database portal (password-protected, admin-only) */}
                  <Route path="/db" element={<SystemDatabase />} />
                  {/* System repository portal (PIN-protected, admin-only) */}
                  <Route path="/system/repo" element={<SystemRepository />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <ScIA />
                <PushNotificationPrompt />
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
