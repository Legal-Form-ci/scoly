import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Star, Package, MapPin, Phone, CheckCircle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface VendorData {
  id: string;
  user_id: string;
  store_name: string;
  store_description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  city: string | null;
  phone: string | null;
  is_verified: boolean;
  total_sales: number;
}

interface Product {
  id: string;
  name_fr: string;
  name_en: string;
  name_de: string;
  name_es: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  stock: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

const VendorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (id) {
      fetchVendorData();
    }
  }, [id]);

  const fetchVendorData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Fetch vendor settings
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendor_settings")
        .select("*")
        .eq("id", id)
        .single();

      if (vendorError) throw vendorError;
      setVendor(vendorData);

      // Fetch vendor products
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name_fr, name_en, name_de, name_es, price, original_price, image_url, stock")
        .eq("vendor_id", vendorData.user_id)
        .eq("is_active", true);

      setProducts(productsData || []);

      // Fetch reviews for vendor's products
      if (productsData && productsData.length > 0) {
        const productIds = productsData.map(p => p.id);
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select("id, rating, comment, created_at, user_id")
          .in("product_id", productIds)
          .order("created_at", { ascending: false })
          .limit(20);

        if (reviewsData) {
          // Fetch profiles for reviews
          const userIds = reviewsData.map(r => r.user_id);
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, first_name, last_name")
            .in("id", userIds);

          const reviewsWithProfiles = reviewsData.map(review => ({
            ...review,
            profiles: profilesData?.find(p => p.id === review.user_id) || null
          }));

          setReviews(reviewsWithProfiles);

          // Calculate average rating
          if (reviewsData.length > 0) {
            const avg = reviewsData.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsData.length;
            setAverageRating(Math.round(avg * 10) / 10);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching vendor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (product: Product) => {
    const names: Record<string, string> = {
      fr: product.name_fr,
      en: product.name_en,
      de: product.name_de,
      es: product.name_es,
    };
    return names[language] || product.name_fr;
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product.id);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!vendor) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Vendeur non trouvé</h1>
          <p className="text-muted-foreground">Ce vendeur n'existe pas ou n'est plus disponible.</p>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Banner */}
      <div 
        className="h-48 md:h-64 bg-gradient-hero bg-cover bg-center"
        style={vendor.banner_url ? { backgroundImage: `url(${vendor.banner_url})` } : undefined}
      />

      <div className="container mx-auto px-4 -mt-16 relative z-10 pb-16">
        {/* Vendor Header */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl bg-muted overflow-hidden border-4 border-background shadow-md">
              {vendor.logo_url ? (
                <img src={vendor.logo_url} alt={vendor.store_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <Package className="w-12 h-12 text-primary" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  {vendor.store_name}
                </h1>
                {vendor.is_verified && (
                  <CheckCircle className="w-6 h-6 text-primary" />
                )}
              </div>
              {vendor.store_description && (
                <p className="text-muted-foreground mb-3">{vendor.store_description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {vendor.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={16} />
                    {vendor.city}, Côte d'Ivoire
                  </span>
                )}
                {vendor.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={16} />
                    {vendor.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Star size={16} className="text-yellow-500 fill-yellow-500" />
                  {averageRating > 0 ? `${averageRating}/5 (${reviews.length} avis)` : "Nouveau vendeur"}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{products.length}</p>
                <p className="text-sm text-muted-foreground">Produits</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{vendor.total_sales?.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground">Ventes (FCFA)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Produits ({products.length})</TabsTrigger>
            <TabsTrigger value="reviews">Avis clients ({reviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            {products.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Ce vendeur n'a pas encore de produits.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-muted overflow-hidden">
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={getProductName(product)}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                        {getProductName(product)}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-primary">
                          {product.price.toLocaleString()} FCFA
                        </span>
                        {product.original_price && product.original_price > product.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {product.original_price.toLocaleString()} FCFA
                          </span>
                        )}
                      </div>
                      <Button
                        variant="hero"
                        size="sm"
                        className="w-full"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                      >
                        <ShoppingCart size={16} />
                        {product.stock > 0 ? t.shop.addToCart : t.shop.outOfStock}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Star className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun avis pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-foreground">
                            {review.profiles?.first_name || "Client"} {review.profiles?.last_name || ""}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={i < (review.rating || 0) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-foreground">{review.comment}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </main>
  );
};

export default VendorProfile;
