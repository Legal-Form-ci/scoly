import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, User, Eye, Heart, BookOpen, PenTool, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

interface Article {
  id: string;
  title_fr: string;
  title_en: string;
  title_de: string;
  title_es: string;
  excerpt_fr: string | null;
  excerpt_en: string | null;
  cover_image: string | null;
  category: string;
  is_premium: boolean;
  views: number;
  likes: number;
  published_at: string | null;
  author_id: string;
}

const Journal = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { value: "all", label: "Toutes les catégories" },
    { value: "general", label: "Général" },
    { value: "education", label: "Éducation" },
    { value: "resources", label: "Ressources" },
    { value: "news", label: "Actualités" },
    { value: "guides", label: "Guides" },
  ];

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = (article: Article) => {
    switch (language) {
      case 'en': return article.title_en;
      case 'de': return article.title_de;
      case 'es': return article.title_es;
      default: return article.title_fr;
    }
  };

  const getExcerpt = (article: Article) => {
    switch (language) {
      case 'en': return article.excerpt_en;
      default: return article.excerpt_fr;
    }
  };

  const getCategoryLabel = (category: string) => {
    const found = categories.find(c => c.value === category);
    return found?.label || category;
  };

  const filteredArticles = articles.filter(article => {
    const title = getTitle(article).toLowerCase();
    return title.includes(searchQuery.toLowerCase());
  });

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-primary-foreground">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen size={32} />
              <span className="text-lg font-medium">Journal Scoly</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-6">
              Journal scolaire et publications
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Découvrez des articles, ouvrages et contenus éducatifs publiés par nos auteurs et enseignants
            </p>
            
            {/* Search */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Rechercher un article..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg bg-background border-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <Filter size={16} className="mr-2" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {user && (
              <Link to="/journal/write">
                <Button variant="hero">
                  <PenTool size={18} />
                  Publier un article
                </Button>
              </Link>
            )}
          </div>

          {/* Articles Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Aucun article pour le moment</h3>
              <p className="text-muted-foreground mb-6">
                Soyez le premier à publier un article sur notre journal scolaire !
              </p>
              {user && (
                <Link to="/journal/write">
                  <Button variant="hero">
                    <PenTool size={18} />
                    Publier un article
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <CardHeader className="p-0">
                    <div className="aspect-video bg-gradient-to-br from-primary to-secondary relative overflow-hidden">
                      {article.cover_image ? (
                        <img 
                          src={article.cover_image} 
                          alt={getTitle(article)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="text-primary-foreground/30" size={64} />
                        </div>
                      )}
                      {article.is_premium && (
                        <Badge className="absolute top-4 right-4 bg-accent">Premium</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Badge variant="secondary" className="mb-3">
                      {getCategoryLabel(article.category)}
                    </Badge>
                    <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {getTitle(article)}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {getExcerpt(article) || "Découvrez cet article passionnant sur le journal Scoly..."}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Eye size={14} />
                        {article.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={14} />
                        {article.likes}
                      </span>
                    </div>
                    {article.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(article.published_at).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">
              Vous êtes auteur ou enseignant ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Partagez vos connaissances avec des milliers d'étudiants en publiant vos articles, 
              ouvrages et ressources éducatives sur Scoly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link to="/journal/write">
                  <Button variant="hero" size="lg">
                    <PenTool size={18} />
                    Commencer à écrire
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button variant="hero" size="lg">
                    Créer un compte auteur
                  </Button>
                </Link>
              )}
              <Link to="/about">
                <Button variant="outline" size="lg">
                  En savoir plus
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Journal;
