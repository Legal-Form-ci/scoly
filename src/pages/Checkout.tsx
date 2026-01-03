import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, AlertCircle, MapPin, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useKkiaPay } from "@/hooks/useKkiaPay";

// Regions of Côte d'Ivoire
const regions = [
  "Abidjan",
  "Bas-Sassandra",
  "Comoé",
  "Denguélé",
  "Gôh-Djiboua",
  "Lacs",
  "Lagunes",
  "Montagnes",
  "Sassandra-Marahoué",
  "Savanes",
  "Vallée du Bandama",
  "Woroba",
  "Yamoussoukro",
  "Zanzan"
];

// Cities by region
const citiesByRegion: Record<string, string[]> = {
  "Abidjan": ["Abidjan", "Cocody", "Plateau", "Yopougon", "Marcory", "Koumassi", "Treichville", "Adjamé", "Abobo", "Port-Bouët", "Bingerville"],
  "Bas-Sassandra": ["San-Pédro", "Soubré", "Tabou", "Sassandra"],
  "Comoé": ["Abengourou", "Agnibilékrou", "Aboisso"],
  "Denguélé": ["Odienné"],
  "Gôh-Djiboua": ["Gagnoa", "Divo", "Lakota"],
  "Lacs": ["Dimbokro", "Toumodi", "Yamoussoukro"],
  "Lagunes": ["Dabou", "Grand-Lahou", "Jacqueville", "Tiassalé"],
  "Montagnes": ["Man", "Danané", "Duékoué", "Guiglo"],
  "Sassandra-Marahoué": ["Daloa", "Vavoua", "Issia", "Zuénoula"],
  "Savanes": ["Korhogo", "Boundiali", "Ferkessédougou", "Tengrela"],
  "Vallée du Bandama": ["Bouaké", "Béoumi", "Katiola", "Dabakala"],
  "Woroba": ["Séguéla", "Mankono", "Touba"],
  "Yamoussoukro": ["Yamoussoukro"],
  "Zanzan": ["Bondoukou", "Bouna", "Tanda"]
};

type CheckoutStep = 'form' | 'payment' | 'success';

const Checkout = () => {
  const { language, t } = useLanguage();
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { openPaymentWidget, loading: paymentLoading, isScriptLoaded } = useKkiaPay();

  const [step, setStep] = useState<CheckoutStep>('form');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    region: "",
    city: "",
    commune: "",
    quartier: "",
    address: "",
    landmark: "",
    notes: "",
  });

  // Check for payment success from URL
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      clearCart();
      setStep('success');
      toast({
        title: t.checkout.orderSuccess,
        description: t.checkout.orderSuccessMessage,
      });
    }
  }, [searchParams]);

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
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.region || !formData.city) {
      toast({
        title: t.common.error,
        description: "Veuillez remplir tous les champs obligatoires",
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
      // Build full address
      const fullAddress = [
        formData.address,
        formData.quartier,
        formData.commune,
        formData.city,
        formData.region,
        formData.landmark ? `(Repère: ${formData.landmark})` : ''
      ].filter(Boolean).join(', ');

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          shipping_address: fullAddress,
          phone: formData.phone,
          notes: formData.notes,
          payment_method: 'kkiapay',
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

  const handlePayment = () => {
    if (!orderId || !user) return;

    openPaymentWidget(
      {
        amount: total,
        reason: `Commande Izy-scoly #${orderNumber}`,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone
      },
      orderId,
      user.id,
      async (transactionId) => {
        // Success callback
        await clearCart();
        setStep('success');
        toast({
          title: t.checkout.orderSuccess,
          description: t.checkout.orderSuccessMessage,
        });
      },
      () => {
        // Failed callback
        toast({
          title: "Paiement échoué",
          description: "Veuillez réessayer",
          variant: "destructive",
        });
      }
    );
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

  // Payment screen
  if (step === 'payment') {
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

              {/* Payment info */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <CreditCard className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Paiement sécurisé KkiaPay</p>
                  <p className="text-sm text-muted-foreground">Orange Money, MTN, Moov, Wave</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                <p className="font-medium text-foreground mb-2">Instructions :</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Cliquez sur "Payer maintenant"</li>
                  <li>Sélectionnez votre méthode de paiement</li>
                  <li>Entrez votre numéro et validez</li>
                  <li>Confirmez le paiement sur votre téléphone</li>
                </ol>
              </div>

              <Button
                variant="hero"
                className="w-full h-14 text-lg"
                onClick={handlePayment}
                disabled={paymentLoading || !isScriptLoaded}
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
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

                  {/* Shipping Info - Enhanced */}
                  <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-display font-bold text-foreground">
                        {t.checkout.shippingInfo}
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Région *</Label>
                        <Select 
                          value={formData.region} 
                          onValueChange={(value) => setFormData({ ...formData, region: value, city: "" })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Sélectionner une région" />
                          </SelectTrigger>
                          <SelectContent>
                            {regions.map((region) => (
                              <SelectItem key={region} value={region}>{region}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Ville *</Label>
                        <Select 
                          value={formData.city} 
                          onValueChange={(value) => setFormData({ ...formData, city: value })}
                          disabled={!formData.region}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Sélectionner une ville" />
                          </SelectTrigger>
                          <SelectContent>
                            {(citiesByRegion[formData.region] || []).map((city) => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Commune</Label>
                        <Input
                          value={formData.commune}
                          onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                          className="mt-1"
                          placeholder="Ex: Cocody"
                        />
                      </div>
                      <div>
                        <Label>Quartier</Label>
                        <Input
                          value={formData.quartier}
                          onChange={(e) => setFormData({ ...formData, quartier: e.target.value })}
                          className="mt-1"
                          placeholder="Ex: Riviera 2"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>{t.checkout.address}</Label>
                        <Input
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="mt-1"
                          placeholder="Rue, numéro, bâtiment..."
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Point de repère</Label>
                        <Input
                          value={formData.landmark}
                          onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                          className="mt-1"
                          placeholder="Ex: Près du supermarché, à côté de la pharmacie..."
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Instructions de livraison</Label>
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="mt-1"
                          placeholder="Instructions supplémentaires pour le livreur..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div>
                  <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
                    <h2 className="text-xl font-display font-bold text-foreground mb-6">
                      {t.checkout.orderSummary}
                    </h2>
                    
                    <div className="space-y-4 mb-6">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={item.product?.image_url || "/placeholder.svg"}
                              alt={getLocalizedName(item.product)}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{getLocalizedName(item.product)}</p>
                            <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                            <p className="text-sm font-medium text-primary">
                              {formatPrice((item.product?.price || 0) * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sous-total</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Livraison</span>
                        <span className="text-green-600 font-medium">Gratuite</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(total)}</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="hero"
                      className="w-full mt-6"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t.common.loading}
                        </>
                      ) : (
                        "Procéder au paiement"
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center mt-4">
                      Paiement 100% sécurisé via KkiaPay
                    </p>
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
