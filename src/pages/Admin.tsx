import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  ShoppingBag, 
  Users, 
  Tag, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Bell,
  Store,
  DollarSign,
  Truck,
  Gift,
  BarChart3,
  Database,
  HelpCircle,
  FileText,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminDashboard from "@/components/admin/AdminDashboard";
import UserManagement from "@/components/admin/UserManagement";
import ProductForm from "@/components/admin/ProductForm";
import AuthorsManagement from "@/components/admin/AuthorsManagement";
import PublicationsReview from "@/components/admin/PublicationsReview";
import CouponManagement from "@/components/admin/CouponManagement";
import AdvertisementsManagement from "@/components/admin/AdvertisementsManagement";
import DatabaseManagement from "@/components/admin/DatabaseManagement";
import FAQManagement from "@/components/admin/FAQManagement";
import PlatformSettings from "@/components/admin/PlatformSettings";
import AdvancedStats from "@/components/admin/AdvancedStats";
import PaymentsTab from "@/components/admin/PaymentsTab";
import ShareStatsTab from "@/components/admin/ShareStatsTab";

import { Share2 } from "lucide-react";

type TabType =
  | "dashboard"
  | "products"
  | "categories"
  | "orders"
  | "users"
  | "articles"
  | "authors"
  | "review"
  | "promotions"
  | "notifications"
  | "advertisements"
  | "faq"
  | "stats"
  | "sharestats"
  | "settings"
  | "database"
  | "vendors"
  | "commissions"
  | "deliveries"
  | "loyalty"
  | "payments";

const Admin = () => {
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    checkAdminRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const checkAdminRole = async () => {
    if (!user) {
      setLoading(false);
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (error || !data) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      setLoading(false);
      navigate("/");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  const menuItems = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "stats", label: "Statistiques", icon: BarChart3 },
    { id: "sharestats", label: "Partages & Analytics", icon: Share2 },
    { id: "products", label: "Produits", icon: Package },
    { id: "categories", label: "Catégories", icon: FolderTree },
    { id: "orders", label: "Commandes", icon: ShoppingBag },
    { id: "payments", label: "Paiements", icon: DollarSign },
    { id: "deliveries", label: "Livraisons", icon: Truck },
    { id: "users", label: "Utilisateurs", icon: Users },
    { id: "vendors", label: "Vendeurs", icon: Store },
    { id: "commissions", label: "Commissions", icon: DollarSign },
    { id: "loyalty", label: "Fidélité", icon: Gift },
    { id: "authors", label: "Auteurs", icon: Users },
    { id: "review", label: "Validation", icon: Eye },
    { id: "articles", label: "Actualités", icon: FileText },
    { id: "promotions", label: "Promotions", icon: Tag },
    { id: "advertisements", label: "Publicités", icon: Bell },
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "settings", label: "Paramètres", icon: Settings },
  ];

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 min-h-screen flex">
        {/* Fixed Admin Header with menu toggle - visible on all screen sizes */}
        <div className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border lg:hidden">
          <div className="flex items-center justify-between px-4 py-2">
            <h2 className="text-lg font-display font-bold text-foreground">Admin</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="gap-2"
            >
              <Menu size={18} />
              Menu
            </Button>
          </div>
        </div>

        {/* Sidebar - Desktop */}
        <aside className="w-64 bg-card border-r border-border hidden lg:block sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xl font-display font-bold text-foreground">Administration</h2>
          </div>
          <nav className="px-4 space-y-1 pb-8">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id as TabType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Menu Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-72 p-0 z-[60]">
            <SheetHeader className="p-6 border-b border-border">
              <SheetTitle>Administration</SheetTitle>
            </SheetHeader>
            <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-100px)]">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id as TabType)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Floating Menu Button (bottom right) - Mobile fallback */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 pt-16 lg:pt-4">
          {activeTab === "dashboard" && <AdminDashboard />}
          {activeTab === "stats" && <AdvancedStats />}
          {activeTab === "sharestats" && <ShareStatsTab />}
          {activeTab === "products" && <ProductsTab />}
          {activeTab === "categories" && <CategoriesTab />}
          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "payments" && <PaymentsTab />}
          {activeTab === "deliveries" && <DeliveriesTab />}
          {activeTab === "users" && <UserManagement />}
          {activeTab === "vendors" && <VendorsTab />}
          {activeTab === "commissions" && <CommissionsTab />}
          {activeTab === "loyalty" && <LoyaltyTab />}
          {activeTab === "authors" && <AuthorsManagement />}
          {activeTab === "review" && <PublicationsReview />}
          {activeTab === "articles" && <ArticlesTab />}
          {activeTab === "promotions" && <CouponManagement />}
          {activeTab === "advertisements" && <AdvertisementsManagement />}
          {activeTab === "faq" && <FAQManagement />}
          {activeTab === "settings" && <PlatformSettings />}
        </div>
      </div>
    </main>
  );
};

// Products Tab
const ProductsTab = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();

    const channel = supabase
      .channel('products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*, categories(name_fr)")
      .order("created_at", { ascending: false });
    setProducts(data || []);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name_fr");
    setCategories(data || []);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;
    
    const { error } = await supabase.from("products").delete().eq("id", id);
    
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Produit supprimé");
      fetchProducts();
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name_fr.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground">Produits</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingProduct(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground">
              <Plus size={18} />
              Ajouter un produit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Modifier le produit" : "Ajouter un produit"}</DialogTitle>
            </DialogHeader>
            <ProductForm 
              product={editingProduct}
              categories={categories}
              onSubmit={() => { setIsDialogOpen(false); setEditingProduct(null); fetchProducts(); }}
              onCancel={() => { setIsDialogOpen(false); setEditingProduct(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Image</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nom</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Catégorie</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Prix</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Stock</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Statut</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-t border-border">
                  <td className="py-3 px-4">
                    <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                      <img 
                        src={product.image_url || "/placeholder.svg"} 
                        alt="" 
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-sm">{product.name_fr}</td>
                  <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{product.categories?.name_fr || "-"}</td>
                  <td className="py-3 px-4 font-medium text-sm">{product.price.toLocaleString()} FCFA</td>
                  <td className="py-3 px-4 hidden sm:table-cell">{product.stock}</td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Categories Tab
const CategoriesTab = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name_fr: "",
    name_en: "",
    name_de: "",
    name_es: "",
    slug: "",
    image_url: "",
    parent_id: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name_fr");
    setCategories(data || []);
  };

  const handleSubmit = async () => {
    const categoryData = {
      name_fr: formData.name_fr,
      name_en: formData.name_en || formData.name_fr,
      name_de: formData.name_de || formData.name_fr,
      name_es: formData.name_es || formData.name_fr,
      slug: formData.slug || formData.name_fr.toLowerCase().replace(/\s+/g, "-"),
      image_url: formData.image_url || null,
      parent_id: formData.parent_id || null,
    };

    if (editingCategory) {
      const { error } = await supabase.from("categories").update(categoryData).eq("id", editingCategory.id);
      if (error) toast.error("Erreur lors de la modification");
      else toast.success("Catégorie modifiée");
    } else {
      const { error } = await supabase.from("categories").insert(categoryData);
      if (error) toast.error("Erreur lors de l'ajout");
      else toast.success("Catégorie ajoutée");
    }

    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({ name_fr: "", name_en: "", name_de: "", name_es: "", slug: "", image_url: "", parent_id: "" });
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error("Erreur");
    else { toast.success("Catégorie supprimée"); fetchCategories(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground">Catégories</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground"><Plus size={18} />Ajouter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Modifier" : "Ajouter"} une catégorie</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nom (FR) *</Label><Input value={formData.name_fr} onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })} /></div>
                <div><Label>Nom (EN)</Label><Input value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} /></div>
              </div>
              <div><Label>Slug</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="auto-generé si vide" /></div>
              <div><Label>URL Image</Label><Input value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} /></div>
              <Button onClick={handleSubmit}>{editingCategory ? "Modifier" : "Ajouter"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {cat.image_url && (
                <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                  <img src={cat.image_url} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                </div>
              )}
              <div>
                <p className="font-medium">{cat.name_fr}</p>
                <p className="text-xs text-muted-foreground">{cat.slug}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => { setEditingCategory(cat); setFormData(cat); setIsDialogOpen(true); }}>
                <Edit size={16} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}>
                <Trash2 size={16} className="text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Orders Tab
const OrdersTab = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, profiles(first_name, last_name), order_items(*)")
      .order("created_at", { ascending: false });
    setOrders(data || []);
  };

  const updateStatus = async (id: string, status: 'confirmed' | 'shipped' | 'delivered' | 'cancelled') => {
    await supabase.from("orders").update({ status }).eq("id", id);
    toast.success("Statut mis à jour");
    fetchOrders();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };
    const labels: Record<string, string> = {
      pending: "En attente",
      confirmed: "Confirmée",
      shipped: "Expédiée",
      delivered: "Livrée",
      cancelled: "Annulée"
    };
    return <Badge className={colors[status] || ""}>{labels[status] || status}</Badge>;
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground mb-8">Commandes</h1>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">N° Commande</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Total</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="py-3 px-4 font-mono text-sm">{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    {order.profiles?.first_name} {order.profiles?.last_name}
                  </td>
                  <td className="py-3 px-4 font-medium">{order.total_amount.toLocaleString()} FCFA</td>
                  <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">
                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                            <Eye size={16} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Commande #{order.id.slice(0, 8).toUpperCase()}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Adresse de livraison</p>
                              <p className="font-medium">{order.shipping_address || "Non renseignée"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Téléphone</p>
                              <p className="font-medium">{order.phone || "Non renseigné"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Articles</p>
                              {order.order_items?.map((item: any) => (
                                <div key={item.id} className="flex justify-between text-sm py-2 border-b border-border">
                                  <span>{item.product_name} x{item.quantity}</span>
                                  <span>{item.total_price.toLocaleString()} FCFA</span>
                                </div>
                              ))}
                            </div>
                            <div className="pt-4">
                              <Label>Changer le statut</Label>
                              <Select onValueChange={(val) => updateStatus(order.id, val as 'confirmed' | 'shipped' | 'delivered' | 'cancelled')}>
                                <SelectTrigger><SelectValue placeholder="Choisir un statut" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="confirmed">Confirmée</SelectItem>
                                  <SelectItem value="shipped">Expédiée</SelectItem>
                                  <SelectItem value="delivered">Livrée</SelectItem>
                                  <SelectItem value="cancelled">Annulée</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Deliveries Tab
const DeliveriesTab = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveryUsers, setDeliveryUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchDeliveryOrders();
    fetchDeliveryUsers();
  }, []);

  const fetchDeliveryOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, profiles(first_name, last_name)")
      .in("status", ["confirmed", "shipped"])
      .order("created_at", { ascending: false });
    setOrders(data || []);
  };

  const fetchDeliveryUsers = async () => {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "delivery");
    
    if (roleData && roleData.length > 0) {
      const userIds = roleData.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", userIds);
      setDeliveryUsers(profiles || []);
    }
  };

  const assignDelivery = async (orderId: string, deliveryUserId: string) => {
    await supabase.from("orders").update({ 
      delivery_user_id: deliveryUserId,
      status: 'shipped'
    }).eq("id", orderId);
    toast.success("Livreur assigné");
    fetchDeliveryOrders();
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground mb-8">Gestion des Livraisons</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">En attente d'assignation</p>
          <p className="text-3xl font-display font-bold text-yellow-600">
            {orders.filter(o => !o.delivery_user_id).length}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">En cours de livraison</p>
          <p className="text-3xl font-display font-bold text-blue-600">
            {orders.filter(o => o.delivery_user_id && o.status === 'shipped').length}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Livreurs disponibles</p>
          <p className="text-3xl font-display font-bold text-green-600">
            {deliveryUsers.length}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Commande</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Adresse</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Livreur</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="py-3 px-4 font-mono text-sm">{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="py-3 px-4">{order.profiles?.first_name} {order.profiles?.last_name}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate hidden md:table-cell">
                    {order.shipping_address || "Non renseignée"}
                  </td>
                  <td className="py-3 px-4">
                    {order.delivery_user_id ? (
                      <Badge variant="default">Assigné</Badge>
                    ) : (
                      <Select onValueChange={(val) => assignDelivery(order.id, val)}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Assigner" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.first_name} {user.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="icon">
                      <Eye size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Vendors Tab
const VendorsTab = () => {
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    const { data } = await supabase
      .from("vendor_settings")
      .select("*, profiles(first_name, last_name, email)")
      .order("created_at", { ascending: false });
    setVendors(data || []);
  };

  const toggleVerification = async (id: string, currentStatus: boolean) => {
    await supabase.from("vendor_settings").update({ is_verified: !currentStatus }).eq("id", id);
    toast.success(currentStatus ? "Vendeur désactivé" : "Vendeur vérifié");
    fetchVendors();
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground mb-8">Gestion des Vendeurs</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Total vendeurs</p>
          <p className="text-3xl font-display font-bold text-primary">{vendors.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Vendeurs vérifiés</p>
          <p className="text-3xl font-display font-bold text-green-600">
            {vendors.filter(v => v.is_verified).length}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">En attente de vérification</p>
          <p className="text-3xl font-display font-bold text-yellow-600">
            {vendors.filter(v => !v.is_verified).length}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Boutique</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Propriétaire</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Commission</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ventes</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="border-t border-border">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {vendor.logo_url ? (
                        <img src={vendor.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <Store size={20} className="text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{vendor.store_name}</p>
                        <p className="text-xs text-muted-foreground">{vendor.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    {vendor.profiles?.first_name} {vendor.profiles?.last_name}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">{vendor.commission_rate}%</td>
                  <td className="py-3 px-4">{(vendor.total_sales || 0).toLocaleString()} FCFA</td>
                  <td className="py-3 px-4">
                    <Badge variant={vendor.is_verified ? "default" : "secondary"}>
                      {vendor.is_verified ? "Vérifié" : "En attente"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Switch
                      checked={vendor.is_verified}
                      onCheckedChange={() => toggleVerification(vendor.id, vendor.is_verified)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Commissions Tab
const CommissionsTab = () => {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0 });

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    const { data } = await supabase
      .from("commissions")
      .select("*, vendor_settings(store_name)")
      .order("created_at", { ascending: false });
    setCommissions(data || []);

    const total = data?.reduce((sum, c) => sum + c.commission_amount, 0) || 0;
    const pending = data?.filter(c => c.status === "pending").reduce((sum, c) => sum + c.commission_amount, 0) || 0;
    const paid = data?.filter(c => c.status === "paid").reduce((sum, c) => sum + c.commission_amount, 0) || 0;
    setStats({ total, pending, paid });
  };

  const markAsPaid = async (id: string) => {
    await supabase.from("commissions").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    toast.success("Commission marquée comme payée");
    fetchCommissions();
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground mb-8">Gestion des Commissions</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Total commissions</p>
          <p className="text-3xl font-display font-bold text-primary">{stats.total.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">En attente</p>
          <p className="text-3xl font-display font-bold text-yellow-600">{stats.pending.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Payées</p>
          <p className="text-3xl font-display font-bold text-green-600">{stats.paid.toLocaleString()} FCFA</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vendeur</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Montant vente</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Taux</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Commission</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((commission) => (
                <tr key={commission.id} className="border-t border-border">
                  <td className="py-3 px-4 text-sm">{new Date(commission.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3 px-4">{commission.vendor_settings?.store_name || "-"}</td>
                  <td className="py-3 px-4 hidden md:table-cell">{commission.sale_amount.toLocaleString()} FCFA</td>
                  <td className="py-3 px-4 hidden sm:table-cell">{commission.commission_rate}%</td>
                  <td className="py-3 px-4 font-medium text-primary">{commission.commission_amount.toLocaleString()} FCFA</td>
                  <td className="py-3 px-4">
                    <Badge variant={commission.status === "paid" ? "default" : "secondary"}>
                      {commission.status === "paid" ? "Payé" : "En attente"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {commission.status === "pending" && (
                      <Button variant="outline" size="sm" onClick={() => markAsPaid(commission.id)}>
                        Marquer payé
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Loyalty Tab
const LoyaltyTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalPoints: 0, usersWithPoints: 0, averagePoints: 0 });

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    // Get all users with their orders to calculate loyalty points
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email");

    const { data: orders } = await supabase
      .from("orders")
      .select("user_id, total_amount, status")
      .eq("status", "delivered");

    // Calculate points for each user (1 point per 1000 FCFA)
    const userPoints = profiles?.map(profile => {
      const userOrders = orders?.filter(o => o.user_id === profile.id) || [];
      const totalSpent = userOrders.reduce((acc, o) => acc + o.total_amount, 0);
      const points = Math.floor(totalSpent / 1000);
      return {
        ...profile,
        points,
        totalSpent,
        ordersCount: userOrders.length
      };
    }).filter(u => u.points > 0).sort((a, b) => b.points - a.points) || [];

    setUsers(userPoints);

    // Calculate stats
    const totalPoints = userPoints.reduce((acc, u) => acc + u.points, 0);
    const usersWithPoints = userPoints.length;
    const averagePoints = usersWithPoints > 0 ? Math.round(totalPoints / usersWithPoints) : 0;
    setStats({ totalPoints, usersWithPoints, averagePoints });
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground mb-8">Programme de Fidélité</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Total points distribués</p>
          <p className="text-3xl font-display font-bold text-primary">{stats.totalPoints.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Clients avec points</p>
          <p className="text-3xl font-display font-bold text-green-600">{stats.usersWithPoints}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Points moyens/client</p>
          <p className="text-3xl font-display font-bold text-blue-600">{stats.averagePoints}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Règle d'acquisition</p>
          <p className="text-lg font-bold text-foreground">1 pt / 1000 FCFA</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 mb-8">
        <h3 className="font-semibold mb-4">Récompenses disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="font-medium">-5% sur commande</p>
            <p className="text-sm text-muted-foreground">50 points requis</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="font-medium">Livraison express</p>
            <p className="text-sm text-muted-foreground">100 points requis</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="font-medium">-10% sur commande</p>
            <p className="text-sm text-muted-foreground">200 points requis</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Top clients fidèles</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rang</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Points</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Total dépensé</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Commandes</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 20).map((user, index) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-amber-100 text-amber-800' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      <Gift size={14} />
                      {user.points}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">{user.totalSpent.toLocaleString()} FCFA</td>
                  <td className="py-3 px-4 hidden md:table-cell">{user.ordersCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Articles Tab
const ArticlesTab = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchArticles();

    const channel = supabase
      .channel('articles-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, fetchArticles)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchArticles = async () => {
    const { data } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });
    setArticles(data || []);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("articles").update({ 
      status, 
      published_at: status === "published" ? new Date().toISOString() : null 
    }).eq("id", id);
    toast.success(`Article ${status === "published" ? "publié" : "mis en brouillon"}`);
    fetchArticles();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet article ?")) return;
    await supabase.from("articles").delete().eq("id", id);
    toast.success("Article supprimé");
    fetchArticles();
  };

  const filteredArticles = articles.filter((a) =>
    a.title_fr.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="default" className="bg-green-500">Publié</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500 text-black">En attente</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="outline">Brouillon</Badge>;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground">Gestion des Actualités</h1>
        <Button onClick={() => navigate('/actualites/write')} className="bg-primary text-primary-foreground">
          <Plus size={18} />
          Nouvelle actualité
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un article..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Image</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Titre</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Catégorie</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Vues</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Likes</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map((article) => (
                <tr key={article.id} className="border-t border-border">
                  <td className="py-3 px-4">
                    <div className="w-16 h-12 bg-muted rounded-lg overflow-hidden">
                      <img 
                        src={article.cover_image || "/placeholder.svg"} 
                        alt="" 
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium max-w-xs truncate">{article.title_fr}</td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <Badge variant="outline">{article.category}</Badge>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">{article.views || 0}</td>
                  <td className="py-3 px-4 hidden md:table-cell">{article.likes || 0}</td>
                  <td className="py-3 px-4">
                    {getStatusBadge(article.status)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => navigate(`/actualites/edit/${article.id}`)}
                        title="Modifier"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => updateStatus(article.id, article.status === "published" ? "draft" : "published")}
                      >
                        {article.status === "published" ? "Dépublier" : "Publier"}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(article.id)}>
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;