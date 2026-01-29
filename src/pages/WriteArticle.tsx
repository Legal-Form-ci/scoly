import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Send, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MediaUpload from "@/components/MediaUpload";
import RichTextEditor from "@/components/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";

interface MediaItem {
  url: string;
  type: "image" | "video";
}

const WriteArticle = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const { translateDebounced, translating } = useAutoTranslate();
  
  const [loading, setLoading] = useState(false);
  const [fetchingArticle, setFetchingArticle] = useState(!!id);
  const [form, setForm] = useState({
    title_fr: "",
    title_en: "",
    title_de: "",
    title_es: "",
    content_fr: "",
    content_en: "",
    content_de: "",
    content_es: "",
    excerpt_fr: "",
    excerpt_en: "",
    category: "general",
    is_premium: false,
    price: "0",
    media: [] as MediaItem[],
  });

  const categories = [
    { value: "general", label: "Général" },
    { value: "education", label: "Éducation" },
    { value: "bureautique", label: "Bureautique" },
    { value: "resources", label: "Ressources" },
    { value: "news", label: "Actualités" },
    { value: "guides", label: "Guides" },
  ];

  // Fetch article for editing
  useEffect(() => {
    if (id && user) {
      fetchArticle();
    }
  }, [id, user]);

  // Auto-translate title when French title changes
  const handleTitleChange = (value: string) => {
    setForm(prev => ({ ...prev, title_fr: value }));
    
    if (value.length > 3) {
      translateDebounced(value, (translations) => {
        setForm(prev => ({
          ...prev,
          title_en: prev.title_en || translations.en,
          title_de: prev.title_de || translations.de,
          title_es: prev.title_es || translations.es,
        }));
      });
    }
  };

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        let mediaItems: MediaItem[] = [];
        if (data.media && Array.isArray(data.media)) {
          mediaItems = (data.media as unknown as MediaItem[]).map((item: any) => ({
            url: item.url || "",
            type: item.type === "video" ? "video" : "image",
          }));
        } else if (data.cover_image) {
          mediaItems = [{ url: data.cover_image, type: "image" }];
        }

        setForm({
          title_fr: data.title_fr || "",
          title_en: data.title_en || "",
          title_de: data.title_de || "",
          title_es: data.title_es || "",
          content_fr: data.content_fr || "",
          content_en: data.content_en || "",
          content_de: data.content_de || "",
          content_es: data.content_es || "",
          excerpt_fr: data.excerpt_fr || "",
          excerpt_en: data.excerpt_en || "",
          category: data.category || "general",
          is_premium: data.is_premium || false,
          price: String(data.price || 0),
          media: mediaItems,
        });
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'article.",
        variant: "destructive",
      });
    } finally {
      setFetchingArticle(false);
    }
  };

  const handleSubmit = async (publish: boolean) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour publier.",
        variant: "destructive",
      });
      return;
    }

    if (!form.title_fr || !form.content_fr) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir le titre et le contenu.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const coverImage = form.media.length > 0 ? form.media[0].url : null;
      const mediaJson = form.media.map(item => ({ url: item.url, type: item.type }));

      const articleData = {
        author_id: user.id,
        title_fr: form.title_fr,
        title_en: form.title_en || form.title_fr,
        title_de: form.title_de || form.title_fr,
        title_es: form.title_es || form.title_fr,
        content_fr: form.content_fr,
        content_en: form.content_en || form.content_fr,
        content_de: form.content_de || form.content_fr,
        content_es: form.content_es || form.content_fr,
        excerpt_fr: form.excerpt_fr,
        excerpt_en: form.excerpt_en || form.excerpt_fr,
        excerpt_de: form.excerpt_fr,
        excerpt_es: form.excerpt_fr,
        category: form.category,
        is_premium: form.is_premium,
        price: form.is_premium ? parseFloat(form.price) : 0,
        cover_image: coverImage,
        media: mediaJson as any,
        status: publish ? 'pending' : 'draft',
        published_at: publish ? new Date().toISOString() : null,
      };

      if (id) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Article mis à jour",
          description: publish 
            ? "Votre article a été soumis pour approbation."
            : "Votre brouillon a été enregistré.",
        });
      } else {
        const { error } = await supabase
          .from('articles')
          .insert(articleData);

        if (error) throw error;

        toast({
          title: publish ? "Article soumis" : "Brouillon enregistré",
          description: publish 
            ? "Votre article a été soumis pour approbation."
            : "Votre brouillon a été enregistré.",
        });
      }
      
      navigate('/actualites');
    } catch (error) {
      console.error('Error saving article:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'article.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Connexion requise</h1>
          <p className="text-muted-foreground mb-6">Vous devez être connecté pour écrire un article.</p>
          <Button onClick={() => navigate('/auth')}>Se connecter</Button>
        </div>
        <Footer />
      </main>
    );
  }

  if (fetchingArticle) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-24">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/actualites')}>
          <ArrowLeft size={18} />
          Retour aux actualités
        </Button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            {id ? "Modifier l'article" : "Publier un article"}
          </h1>
          <p className="text-muted-foreground mb-8">Partagez vos idées et conseils avec la communauté Izy-scoly</p>

          <div className="grid gap-8">
            {/* Media Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Images et vidéos</CardTitle>
              </CardHeader>
              <CardContent>
                <MediaUpload
                  value={form.media}
                  onChange={(media) => setForm({ ...form, media })}
                  bucket="article-media"
                  label="Médias de l'article"
                  maxItems={10}
                />
              </CardContent>
            </Card>

            {/* Titles with auto-translation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Titres
                  {translating && <Loader2 size={16} className="animate-spin text-primary" />}
                  <Sparkles size={16} className="text-primary" />
                  <span className="text-xs text-muted-foreground font-normal">Traduction automatique</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title_fr">Titre (Français) *</Label>
                  <Input
                    id="title_fr"
                    placeholder="Un titre accrocheur..."
                    value={form.title_fr}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="title_en">Titre (Anglais)</Label>
                    <Input
                      id="title_en"
                      placeholder="English title..."
                      value={form.title_en}
                      onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="title_de">Titre (Allemand)</Label>
                    <Input
                      id="title_de"
                      placeholder="Deutscher Titel..."
                      value={form.title_de}
                      onChange={(e) => setForm({ ...form, title_de: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="title_es">Titre (Espagnol)</Label>
                    <Input
                      id="title_es"
                      placeholder="Título en español..."
                      value={form.title_es}
                      onChange={(e) => setForm({ ...form, title_es: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Content with Rich Text Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Contenu de l'article</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="excerpt_fr">Résumé (Français)</Label>
                  <Textarea
                    id="excerpt_fr"
                    placeholder="Un bref résumé de votre article..."
                    value={form.excerpt_fr}
                    onChange={(e) => setForm({ ...form, excerpt_fr: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Contenu (Français) *</Label>
                  <RichTextEditor
                    content={form.content_fr}
                    onChange={(content) => setForm({ ...form, content_fr: content })}
                    placeholder="Rédigez votre article ici avec le formatage souhaité..."
                    className="min-h-[400px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Paramètres</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Catégorie</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
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

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Contenu premium</Label>
                    <p className="text-sm text-muted-foreground">Les lecteurs devront payer pour accéder</p>
                  </div>
                  <Switch
                    checked={form.is_premium}
                    onCheckedChange={(checked) => setForm({ ...form, is_premium: checked })}
                  />
                </div>

                {form.is_premium && (
                  <div>
                    <Label htmlFor="price">Prix (FCFA)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button variant="outline" onClick={() => handleSubmit(false)} disabled={loading}>
                <Save size={18} />
                Enregistrer le brouillon
              </Button>
              <Button variant="hero" onClick={() => handleSubmit(true)} disabled={loading}>
                <Send size={18} />
                Soumettre pour publication
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default WriteArticle;
