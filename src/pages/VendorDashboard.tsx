import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, DollarSign, ShoppingBag, TrendingUp, Plus, Eye, Edit, Trash2, BarChart3, Wallet, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface VendorStats {
  totalSales: number;
  totalEarnings: number;
  pendingPayout: number;
  totalProducts: number;
  totalOrders: number;
}

interface Product {
  id: string;
  name_fr: string;
  name_en: string;
  price: number;
  stock: number;
  is_active: boolean;
  image_url: string | null;
}

interface Commission {
  id: string;
  sale_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  created_at: string;
}

const VendorDashboard = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<VendorStats>({
    totalSales: 0,
    totalEarnings: 0,
    pendingPayout: 0,
    totalProducts: 0,
    totalOrders: 0,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    name_fr: "",
    name_en: "",
    name_de: "",
    name_es: "",
    description_fr: "",
    description_en: "",
    description_de: "",
    description_es: "",
    price: "",
    stock: "",
    category_id: "",
  });

  useEffect(() => {
    if (user) {
      fetchVendorData();
    }
  }, [user]);

  const fetchVendorData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch vendor settings
      const { data: vendorSettings } = await supabase
        .from('vendor_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name_fr, name_en, price, stock, is_active, image_url')
        .eq('vendor_id', user.id);

      // Fetch commissions
      const { data: commissionsData } = await supabase
        .from('commissions')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      setProducts(productsData || []);
      setCommissions(commissionsData || []);
      
      setStats({
        totalSales: vendorSettings?.total_sales || 0,
        totalEarnings: vendorSettings?.total_earnings || 0,
        pendingPayout: vendorSettings?.pending_payout || 0,
        totalProducts: productsData?.length || 0,
        totalOrders: commissionsData?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          vendor_id: user.id,
          name_fr: productForm.name_fr,
          name_en: productForm.name_en || productForm.name_fr,
          name_de: productForm.name_de || productForm.name_fr,
          name_es: productForm.name_es || productForm.name_fr,
          description_fr: productForm.description_fr,
          description_en: productForm.description_en || productForm.description_fr,
          description_de: productForm.description_de || productForm.description_fr,
          description_es: productForm.description_es || productForm.description_fr,
          price: parseFloat(productForm.price),
          stock: parseInt(productForm.stock),
          category_id: productForm.category_id || null,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "Produit ajouté",
        description: "Votre produit a été ajouté avec succès.",
      });
      
      setIsProductDialogOpen(false);
      setProductForm({
        name_fr: "",
        name_en: "",
        name_de: "",
        name_es: "",
        description_fr: "",
        description_en: "",
        description_de: "",
        description_es: "",
        price: "",
        stock: "",
        category_id: "",
      });
      fetchVendorData();
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le produit.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé.",
      });
      
      fetchVendorData();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const getProductName = (product: Product) => {
    return language === 'en' ? product.name_en : product.name_fr;
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

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Tableau de bord vendeur</h1>
            <p className="text-muted-foreground">Gérez vos produits, commandes et revenus</p>
          </div>
          <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus size={18} />
                Ajouter un produit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau produit</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name_fr">Nom (Français) *</Label>
                    <Input
                      id="name_fr"
                      value={productForm.name_fr}
                      onChange={(e) => setProductForm({ ...productForm, name_fr: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name_en">Nom (Anglais)</Label>
                    <Input
                      id="name_en"
                      value={productForm.name_en}
                      onChange={(e) => setProductForm({ ...productForm, name_en: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description_fr">Description (Français)</Label>
                  <Textarea
                    id="description_fr"
                    value={productForm.description_fr}
                    onChange={(e) => setProductForm({ ...productForm, description_fr: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Prix (FCFA) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock *</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleAddProduct} className="w-full">
                  Ajouter le produit
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventes totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales.toLocaleString()} FCFA</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gains nets</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayout.toLocaleString()} FCFA</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="wallet" className="space-y-6">
          <TabsList>
            <TabsTrigger value="wallet">Portefeuille</TabsTrigger>
            <TabsTrigger value="products">Mes produits</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
          </TabsList>

          <TabsContent value="wallet">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Mon Portefeuille
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
                    <p className="text-sm opacity-80 mb-2">Solde disponible</p>
                    <p className="text-4xl font-display font-bold">{stats.pendingPayout.toLocaleString()} FCFA</p>
                    <p className="text-xs opacity-60 mt-2">Après déduction commission 2%</p>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <p className="text-sm text-muted-foreground mb-2">Total des ventes</p>
                    <p className="text-3xl font-display font-bold text-foreground">{stats.totalSales.toLocaleString()} FCFA</p>
                    <p className="text-xs text-muted-foreground mt-2">Depuis votre inscription</p>
                  </div>
                </div>

                <div className="bg-muted rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <CreditCard size={20} />
                    Demander un retrait
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pour demander un retrait de vos gains, contactez l'équipe Scoly via WhatsApp. 
                    Votre demande sera traitée sous 24-48h ouvrées.
                  </p>
                  <a
                    href={`https://wa.me/2250759566087?text=Bonjour%2C%20je%20suis%20vendeur%20sur%20Scoly%20et%20je%20souhaite%20demander%20un%20retrait%20de%20${stats.pendingPayout}%20FCFA.`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="hero" className="w-full md:w-auto">
                      <Wallet size={18} />
                      Demander un retrait via WhatsApp
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Mes produits ({products.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Vous n'avez pas encore de produits.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setIsProductDialogOpen(true)}>
                      <Plus size={18} />
                      Ajouter votre premier produit
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{getProductName(product)}</TableCell>
                          <TableCell>{product.price.toLocaleString()} FCFA</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>
                            <Badge variant={product.is_active ? "default" : "secondary"}>
                              {product.is_active ? "Actif" : "Inactif"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => navigate(`/product/${product.id}`)}>
                                <Eye size={16} />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle>Historique des commissions</CardTitle>
              </CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Aucune commission pour le moment.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant vente</TableHead>
                        <TableHead>Taux (%)</TableHead>
                        <TableHead>Commission Scoly</TableHead>
                        <TableHead>Votre gain</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell>{new Date(commission.created_at).toLocaleDateString('fr-FR')}</TableCell>
                          <TableCell>{commission.sale_amount.toLocaleString()} FCFA</TableCell>
                          <TableCell>{commission.commission_rate}%</TableCell>
                          <TableCell>{commission.commission_amount.toLocaleString()} FCFA</TableCell>
                          <TableCell className="font-medium text-green-600">
                            {(commission.sale_amount - commission.commission_amount).toLocaleString()} FCFA
                          </TableCell>
                          <TableCell>
                            <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                              {commission.status === 'paid' ? 'Payé' : 'En attente'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques de vente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-muted rounded-lg p-6 text-center">
                    <p className="text-4xl font-bold text-primary">{stats.totalProducts}</p>
                    <p className="text-muted-foreground">Produits en ligne</p>
                  </div>
                  <div className="bg-muted rounded-lg p-6 text-center">
                    <p className="text-4xl font-bold text-secondary">{stats.totalOrders}</p>
                    <p className="text-muted-foreground">Ventes réalisées</p>
                  </div>
                  <div className="bg-muted rounded-lg p-6 text-center">
                    <p className="text-4xl font-bold text-accent">{stats.pendingPayout.toLocaleString()}</p>
                    <p className="text-muted-foreground">FCFA à recevoir</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </main>
  );
};

export default VendorDashboard;
