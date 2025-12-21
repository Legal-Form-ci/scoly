import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const WriteArticle = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title_fr: "",
    title_en: "",
    title_de: "",
    title_es: "",
    content_fr: "",
    content_en: "",
    excerpt_fr: "",
    excerpt_en: "",
    category: "general",
    is_premium: false,
    price: "0",
    cover_image: "",
  });

  const categories = [
    { value: "general", label: "Général" },
    { value: "education", label: "Éducation" },
    { value: "resources", label: "Ressources" },
    { value: "news", label: "Actualités" },
    { value: "guides", label: "Guides" },
  ];

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
      const { error } = await supabase
        .from('articles')
        .insert({
          author_id: user.id,
          title_fr: form.title_fr,
          title_en: form.title_en || form.title_fr,
          title_de: form.title_de || form.title_fr,
          title_es: form.title_es || form.title_fr,
          content_fr: form.content_fr,
          content_en: form.content_en || form.content_fr,
          content_de: form.content_fr,
          content_es: form.content_fr,
          excerpt_fr: form.excerpt_fr,
          excerpt_en: form.excerpt_en || form.excerpt_fr,
          excerpt_de: form.excerpt_fr,
          excerpt_es: form.excerpt_fr,
          category: form.category,
          is_premium: form.is_premium,
          price: form.is_premium ? parseFloat(form.price) : 0,
          cover_image: form.cover_image || null,
          status: publish ? 'pending' : 'draft',
          published_at: publish ? new Date().toISOString() : null,
        });

      if (error) throw error;

      toast({
        title: publish ? "Article soumis" : "Brouillon enregistré",
        description: publish 
          ? "Votre article a été soumis pour approbation."
          : "Votre brouillon a été enregistré.",
      });
      
      navigate('/journal');
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

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-24">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/journal')}>
          <ArrowLeft size={18} />
          Retour au journal
        </Button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Rédiger un article</h1>
          <p className="text-muted-foreground mb-8">Partagez vos connaissances avec la communauté Scoly</p>

          <div className="grid gap-8">
            {/* Main Content */}
            <Card>
              <CardHeader>
                <CardTitle>Contenu de l'article</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title_fr">Titre (Français) *</Label>
                  <Input
                    id="title_fr"
                    placeholder="Un titre accrocheur..."
                    value={form.title_fr}
                    onChange={(e) => setForm({ ...form, title_fr: e.target.value })}
                    className="text-lg"
                  />
                </div>

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
                  <Label htmlFor="content_fr">Contenu (Français) *</Label>
                  <Textarea
                    id="content_fr"
                    placeholder="Rédigez votre article ici..."
                    value={form.content_fr}
                    onChange={(e) => setForm({ ...form, content_fr: e.target.value })}
                    rows={15}
                  />
                </div>

                <div>
                  <Label htmlFor="cover_image">URL de l'image de couverture</Label>
                  <Input
                    id="cover_image"
                    placeholder="https://..."
                    value={form.cover_image}
                    onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
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
