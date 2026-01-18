import { useState, useEffect } from "react";
import { Search, Filter, ShoppingCart, Heart, Star, Truck, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SmartImage from "@/components/SmartImage";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Link, useSearchParams } from "react-router-dom";

interface Product {
  id: string;
  name_fr: string;
  name_en: string;
  name_de: string;
  name_es: string;
  description_fr: string | null;
  description_en: string | null;
  description_de: string | null;
  description_es: string | null;
  price: number;
  original_price: number | null;
  discount_percent: number;
  stock: number;
  image_url: string | null;
  is_featured: boolean;
  category_id: string | null;
  free_shipping: boolean;
}

interface Category {
  id: string;
  name_fr: string;
  name_en: string;
  name_de: string;
  name_es: string;
  slug: string;
}

const Shop = () => {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category") || null
  );
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      const cat = categories.find(c => c.slug === categoryParam);
      if (cat) {
        setSelectedCategory(cat.id);
      }
    }
  }, [searchParams, categories]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name_fr');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const getLocalizedName = (item: Product | Category) => {
    switch (language) {
      case 'en': return item.name_en;
      case 'de': return item.name_de;
      case 'es': return item.name_es;
      default: return item.name_fr;
    }
  };

  const handleCategoryClick = (categoryId: string | null, slug?: string) => {
    setSelectedCategory(categoryId);
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  const filteredProducts = products
    .filter(product => {
      const name = getLocalizedName(product).toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        default: return 0;
      }
    });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' ' + t.common.currency;
  };

  return (
    <main className="min-h-screen bg-background">
      <SEOHead 
        title="Boutique - Fournitures scolaires et bureautiques"
        description="Découvrez notre catalogue complet de fournitures scolaires et bureautiques. Livres, cahiers, stylos, matériel de bureau. Livraison gratuite en Côte d'Ivoire."
        url="https://izy-scoly.ci/shop"
        keywords={["boutique", "fournitures scolaires", "bureautique", "acheter", "Côte d'Ivoire"]}
      />
      <Navbar />
      
      {/* Hero Section - Fond solide sans dégradé */}
      <section className="pt-24 pb-12 bg-primary">
        <div className="container mx-auto px-4">
          <div className="text-center text-primary-foreground">
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">
              Boutique Izy-Scoly
            </h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto mb-4">
              Toutes vos fournitures scolaires et bureautiques en un seul endroit
            </p>
            <div className="flex items-center justify-center gap-2 text-sm">
              <Truck size={18} />
              <span>Livraison gratuite sur toutes les commandes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Banner */}
      <section className="py-6 bg-muted/50 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handleCategoryClick(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !selectedCategory 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card border border-border hover:bg-muted'
              }`}
            >
              Tous les produits
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id, category.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card border border-border hover:bg-muted'
                }`}
              >
                {getLocalizedName(category)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Filters & Products */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 space-y-6">
              {/* Search */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    type="text"
                    placeholder={t.shop.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">{t.shop.categories}</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCategoryClick(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      !selectedCategory ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    {t.shop.allCategories}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id, category.slug)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      }`}
                    >
                      {getLocalizedName(category)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">{t.shop.sortBy}</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
                >
                  <option value="newest">{t.shop.sortNewest}</option>
                  <option value="price-asc">{t.shop.sortPriceAsc}</option>
                  <option value="price-desc">{t.shop.sortPriceDesc}</option>
                  <option value="popular">{t.shop.sortPopular}</option>
                </select>
              </div>

              {/* Free Shipping Banner */}
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                  <Truck size={20} />
                  <span className="font-semibold">Livraison gratuite</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-500">
                  Sur toutes vos commandes, partout en Côte d'Ivoire
                </p>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Results count */}
              <div className="mb-6 flex items-center justify-between">
                <p className="text-muted-foreground">
                  {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
                </p>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-card rounded-xl p-2 sm:p-4 animate-pulse">
                      <div className="aspect-square bg-muted rounded-lg mb-2 sm:mb-4" />
                      <div className="h-3 sm:h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 sm:h-4 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t.common.noResults}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all flex flex-col"
                    >
                      {/* Image avec SmartImage */}
                      <Link to={`/shop/product/${product.id}`} className="relative aspect-square block overflow-hidden">
                        <SmartImage
                          src={product.image_url}
                          alt={getLocalizedName(product)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          fallbackSrc="/placeholder.svg"
                        />
                        
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {product.discount_percent > 0 && (
                            <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                              -{product.discount_percent}%
                            </Badge>
                          )}
                          {product.is_featured && (
                            <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                              ⭐
                            </Badge>
                          )}
                        </div>

                        {/* Free Shipping Badge */}
                        <div className="absolute bottom-2 left-2">
                          <Badge className="bg-green-500 text-white text-[9px] sm:text-[10px] px-1 py-0.5">
                            <Truck size={10} className="mr-0.5" />
                            <span className="hidden sm:inline">Livraison gratuite</span>
                            <span className="sm:hidden">Gratuit</span>
                          </Badge>
                        </div>

                        {/* Wishlist Button */}
                        <button className="absolute top-2 right-2 p-1.5 sm:p-2 bg-card/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Heart size={14} className="text-foreground sm:w-[18px] sm:h-[18px]" />
                        </button>
                      </Link>

                      {/* Content */}
                      <div className="p-2 sm:p-3 md:p-4 flex flex-col flex-1">
                        <Link to={`/shop/product/${product.id}`}>
                          <h3 className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2 text-xs sm:text-sm">
                            {getLocalizedName(product)}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-0.5 mt-1 sm:mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} className="fill-accent text-accent sm:w-3.5 sm:h-3.5" />
                          ))}
                          <span className="text-[10px] sm:text-xs text-muted-foreground ml-1">(0)</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 mt-2 sm:mt-3">
                          <span className="text-sm sm:text-base md:text-lg font-bold text-primary">
                            {formatPrice(product.price)}
                          </span>
                          {product.original_price && product.original_price > product.price && (
                            <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                              {formatPrice(product.original_price)}
                            </span>
                          )}
                        </div>

                        <div className="mt-auto pt-2 sm:pt-3">
                          <Button
                            variant="hero"
                            size="sm"
                            className="w-full text-xs sm:text-sm h-8 sm:h-9"
                            onClick={() => addToCart(product.id)}
                            disabled={product.stock === 0}
                          >
                            <ShoppingCart size={14} className="sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">{product.stock === 0 ? t.shop.outOfStock : t.shop.addToCart}</span>
                            <span className="sm:hidden">{product.stock === 0 ? 'Épuisé' : '+'}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Shop;
