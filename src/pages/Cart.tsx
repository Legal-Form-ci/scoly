import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SmartImage from "@/components/SmartImage";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

const Cart = () => {
  const { language, t } = useLanguage();
  const { items, loading, removeFromCart, updateQuantity, total } = useCart();
  const { user } = useAuth();

  const getLocalizedName = (product: any) => {
    if (!product) return '';
    switch (language) {
      case 'en': return product.name_en;
      case 'de': return product.name_de;
      case 'es': return product.name_es;
      default: return product.name_fr;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' ' + t.common.currency;
  };

  // Guest users can now view their cart - login only required at checkout

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-display font-bold text-foreground mb-8">
            {t.nav.cart}
          </h1>

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl p-4 flex gap-4">
                  <div className="w-24 h-24 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag size={64} className="mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {t.shop.emptyCart}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t.shop.continueShopping}
              </p>
              <Link to="/shop">
                <Button variant="hero">
                  <ShoppingBag size={18} />
                  {t.shop.continueShopping}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card rounded-xl border border-border p-4 flex gap-4"
                  >
                    {/* Image */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <SmartImage
                        src={item.product?.image_url}
                        alt={getLocalizedName(item.product)}
                        className="w-full h-full object-cover"
                        fallbackSrc="/placeholder.svg"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {getLocalizedName(item.product)}
                      </h3>
                      <p className="text-primary font-semibold mt-1">
                        {formatPrice(item.product?.price || 0)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded-lg border border-border hover:bg-muted transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-lg border border-border hover:bg-muted transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
                  <h2 className="text-xl font-display font-bold text-foreground mb-6">
                    {t.checkout.orderSummary}
                  </h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t.shop.subtotal}</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t.shop.shipping}</span>
                      <span>{t.shop.freeShipping}</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between font-bold text-foreground">
                      <span>{t.shop.total}</span>
                      <span className="text-primary">{formatPrice(total)}</span>
                    </div>
                  </div>

                  {user ? (
                    <Link to="/checkout" className="block">
                      <Button variant="hero" className="w-full">
                        {t.shop.proceedCheckout}
                        <ArrowRight size={18} />
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/auth?redirect=/checkout" className="block">
                      <Button variant="hero" className="w-full">
                        {t.nav.login} pour commander
                        <ArrowRight size={18} />
                      </Button>
                    </Link>
                  )}

                  <Link to="/shop" className="block mt-3">
                    <Button variant="outline" className="w-full">
                      {t.shop.continueShopping}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default Cart;
