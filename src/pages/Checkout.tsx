import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, CreditCard, Loader2, Phone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePayment, PaymentMethod } from "@/hooks/usePayment";
import PaymentTracker from "@/components/PaymentTracker";
import { cn } from "@/lib/utils";

const paymentMethods: { id: PaymentMethod; name: string; color: string }[] = [
  { id: 'orange', name: 'Orange Money', color: 'bg-orange-500' },
  { id: 'mtn', name: 'MTN Mobile Money', color: 'bg-yellow-400' },
  { id: 'moov', name: 'Moov Money', color: 'bg-blue-500' },
  { id: 'wave', name: 'Wave', color: 'bg-cyan-500' },
];

type CheckoutStep = 'form' | 'payment' | 'tracking' | 'success';

const Checkout = () => {
  const { language, t } = useLanguage();
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { initiatePayment, loading: paymentLoading, paymentStatus } = usePayment();

  const [step, setStep] = useState<CheckoutStep>('form');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | "">("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
  });

  // Load user profile data
  useEffect(() => {
    if (user) {
      const loadProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone')
          .eq('id', user.id)
          .single();

        if (data) {
          setFormData(prev => ({
            ...prev,
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            phone: data.phone || '',
            email: user.email || ''
          }));
        }
      };
      loadProfile();
    }
  }, [user]);

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

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address || !formData.city) {
      toast({
        title: t.common.error,
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return false;
    }
    if (!selectedPayment) {
      toast({
        title: t.common.error,
        description: t.checkout.selectPayment,
        variant: "destructive",
      });
      return false;
    }
    // Validate phone number
    const phoneRegex = /^(\+225)?[0-9\s]{10,}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      toast({
        title: t.common.error,
        description: "Numéro de téléphone invalide",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || items.length === 0) return;
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          shipping_address: `${formData.address}, ${formData.city}`,
          phone: formData.phone,
          payment_method: selectedPayment,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: getLocalizedName(item.product),
        quantity: item.quantity,
        unit_price: item.product?.price || 0,
        total_price: (item.product?.price || 0) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setOrderId(order.id);
      setOrderNumber(order.id.slice(0, 8).toUpperCase());
      
      // Move to payment step
      setStep('payment');
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: t.common.error,
        description: t.common.tryAgain,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayment = async () => {
    if (!orderId || !user || !selectedPayment) return;

    const result = await initiatePayment(
      orderId,
      total,
      selectedPayment as PaymentMethod,
      formData.phone,
      user.id,
      formData.email,
      `${formData.firstName} ${formData.lastName}`
    );

    if (result.success && result.paymentId) {
      setPaymentId(result.paymentId);
      setStep('tracking');
      toast({
        title: "Paiement initié",
        description: result.message,
      });
    } else {
      toast({
        title: t.common.error,
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handlePaymentComplete = async () => {
    await clearCart();
    setStep('success');
    toast({
      title: t.checkout.orderSuccess,
      description: t.checkout.orderSuccessMessage,
    });
  };

  const handlePaymentFailed = () => {
    toast({
      title: "Paiement échoué",
      description: "Veuillez réessayer ou choisir un autre mode de paiement",
      variant: "destructive",
    });
    setStep('payment');
  };

  // Success screen
  if (step === 'success') {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-lg text-center py-20">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-4">
              {t.checkout.orderSuccess}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t.checkout.orderSuccessMessage}
            </p>
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <p className="text-sm text-muted-foreground">{t.checkout.orderNumber}</p>
              <p className="text-2xl font-bold text-primary">{orderNumber}</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button variant="hero" onClick={() => navigate("/account")}>
                {t.checkout.trackOrder}
              </Button>
              <Button variant="outline" onClick={() => navigate("/shop")}>
                Continuer mes achats
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // Payment tracking screen
  if (step === 'tracking' && paymentId) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-lg py-12">
            <h1 className="text-2xl font-display font-bold text-foreground mb-6 text-center">
              Suivi du paiement
            </h1>
            <PaymentTracker
              paymentId={paymentId}
              orderId={orderId || undefined}
              onPaymentComplete={handlePaymentComplete}
              onPaymentFailed={handlePaymentFailed}
            />
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setStep('payment')}
            >
              Retour
            </Button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // Payment initiation screen
  if (step === 'payment') {
    const selectedMethod = paymentMethods.find(m => m.id === selectedPayment);
    
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-lg py-12">
            <h1 className="text-2xl font-display font-bold text-foreground mb-6 text-center">
              Confirmer le paiement
            </h1>
            
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              {/* Order summary */}
              <div className="text-center pb-4 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">Commande #{orderNumber}</p>
                <p className="text-3xl font-bold text-primary">{formatPrice(total)}</p>
              </div>

              {/* Payment method */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className={cn("w-12 h-12 rounded-lg", selectedMethod?.color)} />
                <div>
                  <p className="font-semibold">{selectedMethod?.name}</p>
                  <p className="text-sm text-muted-foreground">{formData.phone}</p>
                </div>
              </div>

              {/* Info message */}
              <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <Phone className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">Instructions</p>
                  <p className="text-muted-foreground">
                    Après avoir cliqué sur "Payer maintenant", vous recevrez une demande de confirmation sur votre téléphone. Validez le paiement pour finaliser votre commande.
                  </p>
                </div>
              </div>

              <Button
                variant="hero"
                className="w-full"
                onClick={handleInitiatePayment}
                disabled={paymentLoading}
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  `Payer ${formatPrice(total)}`
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setStep('form')}
                disabled={paymentLoading}
              >
                Modifier ma commande
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // Form screen
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-display font-bold text-foreground mb-8">
            {t.checkout.title}
          </h1>

          {items.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground mb-4">Votre panier est vide</p>
              <Button variant="hero" onClick={() => navigate('/shop')}>
                Découvrir nos produits
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Billing Info */}
                  <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-xl font-display font-bold text-foreground mb-6">
                      {t.checkout.billingInfo}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">{t.auth.firstName} *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">{t.auth.lastName} *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">{t.auth.email} *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">{t.auth.phone} *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                          className="mt-1"
                          placeholder="+225 07 00 00 00 00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-xl font-display font-bold text-foreground mb-6">
                      {t.checkout.shippingInfo}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Label htmlFor="address">{t.checkout.address} *</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          required
                          className="mt-1"
                          placeholder="Rue, quartier, commune"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">{t.checkout.city} *</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          required
                          className="mt-1"
                          placeholder="Abidjan"
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">{t.checkout.country}</Label>
                        <Input
                          id="country"
                          value="Côte d'Ivoire"
                          disabled
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-xl font-display font-bold text-foreground mb-6">
                      {t.checkout.paymentMethod}
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSelectedPayment(method.id)}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                            selectedPayment === method.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <div className={cn("w-10 h-10 rounded-lg", method.color)} />
                          <span className="font-medium text-foreground">{method.name}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      {t.checkout.paymentNote}
                    </p>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
                    <h2 className="text-xl font-display font-bold text-foreground mb-6">
                      {t.checkout.orderSummary}
                    </h2>

                    <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {item.product?.image_url ? (
                              <img
                                src={item.product.image_url}
                                alt={getLocalizedName(item.product)}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <CreditCard size={20} className="text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {getLocalizedName(item.product)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {t.shop.quantity}: {item.quantity}
                            </p>
                            <p className="text-sm font-semibold text-primary">
                              {formatPrice((item.product?.price || 0) * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 border-t border-border pt-4 mb-6">
                      <div className="flex justify-between text-muted-foreground">
                        <span>{t.shop.subtotal}</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{t.shop.shipping}</span>
                        <span className="text-green-500 font-medium">{t.shop.freeShipping}</span>
                      </div>
                      <div className="border-t border-border pt-3 flex justify-between font-bold text-foreground">
                        <span>{t.shop.total}</span>
                        <span className="text-primary">{formatPrice(total)}</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="hero"
                      className="w-full"
                      disabled={loading || items.length === 0}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t.common.loading}
                        </>
                      ) : (
                        t.checkout.placeOrder
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default Checkout;
