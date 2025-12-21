import { useState, useEffect } from "react";
import { Search, Filter, ShoppingCart, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

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

  const getLocalizedDescription = (product: Product) => {
    switch (language) {
      case 'en': return product.description_en;
      case 'de': return product.description_de;
      case 'es': return product.description_es;
      default: return product.description_fr;
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
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-primary">
        <div className="container mx-auto px-4">
          <div className="text-center text-primary-foreground">
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">
              {t.shop.title}
            </h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              {t.shop.subtitle}
            </p>
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
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      !selectedCategory ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    {t.shop.allCategories}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
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
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
                      <div className="aspect-square bg-muted rounded-lg mb-4" />
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">{t.common.noResults}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all"
                    >
                      {/* Image */}
                      <Link to={`/shop/product/${product.id}`} className="relative aspect-square block overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={getLocalizedName(product)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <ShoppingCart size={48} className="text-muted-foreground" />
                          </div>
                        )}
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {product.discount_percent > 0 && (
                            <Badge variant="destructive">-{product.discount_percent}%</Badge>
                          )}
                          {product.is_featured && (
                            <Badge variant="secondary">{t.shop.featured}</Badge>
                          )}
                        </div>

                        {/* Wishlist Button */}
                        <button className="absolute top-3 right-3 p-2 bg-card/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Heart size={18} className="text-foreground" />
                        </button>
                      </Link>

                      {/* Content */}
                      <div className="p-4">
                        <Link to={`/shop/product/${product.id}`}>
                          <h3 className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2">
                            {getLocalizedName(product)}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-1 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} className="fill-accent text-accent" />
                          ))}
                          <span className="text-sm text-muted-foreground ml-1">(0)</span>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-lg font-bold text-primary">
                            {formatPrice(product.price)}
                          </span>
                          {product.original_price && product.original_price > product.price && (
                            <span className="text-sm text-muted-foreground line-through">
                              {formatPrice(product.original_price)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                          <Button
                            variant="hero"
                            size="sm"
                            className="flex-1"
                            onClick={() => addToCart(product.id)}
                            disabled={product.stock === 0}
                          >
                            <ShoppingCart size={16} />
                            {product.stock === 0 ? t.shop.outOfStock : t.shop.addToCart}
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
