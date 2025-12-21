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
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type TabType = "dashboard" | "products" | "categories" | "orders" | "users" | "articles" | "promotions" | "notifications";

const Admin = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminRole();
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) {
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
      navigate("/");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  const menuItems = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "products", label: "Produits", icon: Package },
    { id: "categories", label: "Catégories", icon: FolderTree },
    { id: "orders", label: "Commandes", icon: ShoppingBag },
    { id: "users", label: "Utilisateurs", icon: Users },
    { id: "articles", label: "Articles Journal", icon: Package },
    { id: "promotions", label: "Promotions", icon: Tag },
  ];

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
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border hidden lg:block">
          <div className="p-6">
            <h2 className="text-xl font-display font-bold text-foreground">Administration</h2>
          </div>
          <nav className="px-4 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Tab Selector */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
          <div className="flex overflow-x-auto">
            {menuItems.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 ${
                  activeTab === item.id ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon size={20} />
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 lg:p-8 pb-24 lg:pb-8">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "products" && <ProductsTab />}
          {activeTab === "categories" && <CategoriesTab />}
          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "articles" && <ArticlesTab />}
          {activeTab === "promotions" && <PromotionsTab />}
        </div>
      </div>
    </main>
  );
};

// Dashboard Tab
const DashboardTab = () => {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [products, orders, users] = await Promise.all([
      supabase.from("products").select("id", { count: "exact" }),
      supabase.from("orders").select("total_amount"),
      supabase.from("profiles").select("id", { count: "exact" }),
    ]);

    const revenue = orders.data?.reduce((acc, o) => acc + (o.total_amount || 0), 0) || 0;

    setStats({
      products: products.count || 0,
      orders: orders.data?.length || 0,
      users: users.count || 0,
      revenue,
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground mb-8">Tableau de bord</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Produits" value={stats.products} color="primary" />
        <StatCard title="Commandes" value={stats.orders} color="secondary" />
        <StatCard title="Utilisateurs" value={stats.users} color="accent" />
        <StatCard title="Revenus" value={`${stats.revenue.toLocaleString()} FCFA`} color="primary" />
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Dernières commandes</h2>
        <RecentOrders />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color }: { title: string; value: string | number; color: string }) => (
  <div className="bg-card rounded-xl border border-border p-6">
    <p className="text-muted-foreground text-sm mb-2">{title}</p>
    <p className={`text-3xl font-display font-bold text-${color}`}>{value}</p>
  </div>
);

const RecentOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    setOrders(data || []);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Montant</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border">
              <td className="py-3 px-4 text-sm font-mono">{order.id.slice(0, 8)}...</td>
              <td className="py-3 px-4 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
              <td className="py-3 px-4 text-sm font-medium">{order.total_amount.toLocaleString()} FCFA</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || ""}`}>
                  {order.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Products Tab
const ProductsTab = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name_fr: "",
    name_en: "",
    name_de: "",
    name_es: "",
    description_fr: "",
    description_en: "",
    description_de: "",
    description_es: "",
    price: "",
    original_price: "",
    discount_percent: "",
    stock: "",
    category_id: "",
    image_url: "",
    is_active: true,
    is_featured: false,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
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

  const handleSubmit = async () => {
    const productData = {
      name_fr: formData.name_fr,
      name_en: formData.name_en || formData.name_fr,
      name_de: formData.name_de || formData.name_fr,
      name_es: formData.name_es || formData.name_fr,
      description_fr: formData.description_fr,
      description_en: formData.description_en,
      description_de: formData.description_de,
      description_es: formData.description_es,
      price: parseFloat(formData.price) || 0,
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      discount_percent: formData.discount_percent ? parseInt(formData.discount_percent) : 0,
      stock: parseInt(formData.stock) || 0,
      category_id: formData.category_id || null,
      image_url: formData.image_url || null,
      is_active: formData.is_active,
      is_featured: formData.is_featured,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProduct.id);
      
      if (error) {
        toast.error("Erreur lors de la modification");
      } else {
        toast.success("Produit modifié avec succès");
      }
    } else {
      const { error } = await supabase.from("products").insert(productData);
      
      if (error) {
        toast.error("Erreur lors de l'ajout");
      } else {
        toast.success("Produit ajouté avec succès");
      }
    }

    setIsDialogOpen(false);
    resetForm();
    fetchProducts();
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name_fr: product.name_fr,
      name_en: product.name_en,
      name_de: product.name_de,
      name_es: product.name_es,
      description_fr: product.description_fr || "",
      description_en: product.description_en || "",
      description_de: product.description_de || "",
      description_es: product.description_es || "",
      price: product.price.toString(),
      original_price: product.original_price?.toString() || "",
      discount_percent: product.discount_percent?.toString() || "",
      stock: product.stock?.toString() || "0",
      category_id: product.category_id || "",
      image_url: product.image_url || "",
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
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

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name_fr: "",
      name_en: "",
      name_de: "",
      name_es: "",
      description_fr: "",
      description_en: "",
      description_de: "",
      description_es: "",
      price: "",
      original_price: "",
      discount_percent: "",
      stock: "",
      category_id: "",
      image_url: "",
      is_active: true,
      is_featured: false,
    });
  };

  const filteredProducts = products.filter((p) =>
    p.name_fr.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground">Produits</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus size={18} />
              Ajouter un produit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Modifier le produit" : "Ajouter un produit"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom (FR) *</Label>
                  <Input value={formData.name_fr} onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })} />
                </div>
                <div>
                  <Label>Nom (EN)</Label>
                  <Input value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} />
                </div>
                <div>
                  <Label>Nom (DE)</Label>
                  <Input value={formData.name_de} onChange={(e) => setFormData({ ...formData, name_de: e.target.value })} />
                </div>
                <div>
                  <Label>Nom (ES)</Label>
                  <Input value={formData.name_es} onChange={(e) => setFormData({ ...formData, name_es: e.target.value })} />
                </div>
              </div>
              
              <div>
                <Label>Description (FR)</Label>
                <Textarea value={formData.description_fr} onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Prix (FCFA) *</Label>
                  <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                </div>
                <div>
                  <Label>Prix original</Label>
                  <Input type="number" value={formData.original_price} onChange={(e) => setFormData({ ...formData, original_price: e.target.value })} />
                </div>
                <div>
                  <Label>Réduction (%)</Label>
                  <Input type="number" value={formData.discount_percent} onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Stock</Label>
                  <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
                </div>
                <div>
                  <Label>Catégorie</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name_fr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>URL de l'image</Label>
                <Input value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                  <Label>Actif</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })} />
                  <Label>En vedette</Label>
                </div>
              </div>

              <Button onClick={handleSubmit} className="w-full">
                {editingProduct ? "Modifier" : "Ajouter"}
              </Button>
            </div>
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
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Catégorie</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Prix</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Stock</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-t border-border">
                  <td className="py-3 px-4">
                    <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                      <img src={product.image_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">{product.name_fr}</td>
                  <td className="py-3 px-4 text-muted-foreground">{product.categories?.name_fr || "-"}</td>
                  <td className="py-3 px-4 font-medium">{product.price.toLocaleString()} FCFA</td>
                  <td className="py-3 px-4">{product.stock}</td>
                  <td className="py-3 px-4">
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
            <Button variant="hero"><Plus size={18} />Ajouter</Button>
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
                  <img src={cat.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <p className="font-medium">{cat.name_fr}</p>
                <p className="text-sm text-muted-foreground">{cat.slug}</p>
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
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    setOrders(data || []);
  };

  const updateStatus = async (id: string, status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled") => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error("Erreur");
    else { toast.success("Statut mis à jour"); fetchOrders(); }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground mb-8">Commandes</h1>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Montant</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Paiement</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="py-3 px-4 font-mono text-sm">{order.id.slice(0, 8)}...</td>
                  <td className="py-3 px-4 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-sm">{order.phone || "-"}</td>
                  <td className="py-3 px-4 font-medium">{order.total_amount.toLocaleString()} FCFA</td>
                  <td className="py-3 px-4 text-sm">{order.payment_method || "-"}</td>
                  <td className="py-3 px-4">
                    <Select value={order.status} onValueChange={(value: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled") => updateStatus(order.id, value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="confirmed">Confirmée</SelectItem>
                        <SelectItem value="shipped">Expédiée</SelectItem>
                        <SelectItem value="delivered">Livrée</SelectItem>
                        <SelectItem value="cancelled">Annulée</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                      <Eye size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Commande #{selectedOrder.id.slice(0, 8)}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Adresse de livraison</p>
                <p>{selectedOrder.shipping_address || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Téléphone</p>
                <p>{selectedOrder.phone || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Articles</p>
                {selectedOrder.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between py-2 border-b border-border">
                    <span>{item.product_name} x{item.quantity}</span>
                    <span>{item.total_price.toLocaleString()} FCFA</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-lg pt-2">
                <span>Total</span>
                <span>{selectedOrder.total_amount.toLocaleString()} FCFA</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Users Tab
const UsersTab = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*, user_roles(role)")
      .order("created_at", { ascending: false });
    setUsers(data || []);
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground mb-8">Utilisateurs</h1>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nom</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Téléphone</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rôle</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="py-3 px-4 font-medium">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="py-3 px-4">{user.phone || "-"}</td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary">
                      {user.user_roles?.[0]?.role || "user"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
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
      .select("*")
      .order("created_at", { ascending: false });
    setVendors(data || []);
  };

  const toggleVerified = async (id: string, current: boolean) => {
    await supabase.from("vendor_settings").update({ is_verified: !current }).eq("id", id);
    toast.success(current ? "Vendeur non vérifié" : "Vendeur vérifié");
    fetchVendors();
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground mb-8">Gestion des Vendeurs</h1>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Boutique</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ville</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Téléphone</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ventes totales</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">À payer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vérifié</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="border-t border-border">
                  <td className="py-3 px-4 font-medium">{vendor.store_name}</td>
                  <td className="py-3 px-4">{vendor.city || "-"}</td>
                  <td className="py-3 px-4">{vendor.phone || "-"}</td>
                  <td className="py-3 px-4">{(vendor.total_sales || 0).toLocaleString()} FCFA</td>
                  <td className="py-3 px-4 font-medium text-green-600">{(vendor.pending_payout || 0).toLocaleString()} FCFA</td>
                  <td className="py-3 px-4">
                    <Badge variant={vendor.is_verified ? "default" : "secondary"}>
                      {vendor.is_verified ? "Oui" : "Non"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="outline" size="sm" onClick={() => toggleVerified(vendor.id, vendor.is_verified)}>
                      {vendor.is_verified ? "Retirer" : "Vérifier"}
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

    // Calculate stats
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
      <h1 className="text-2xl font-display font-bold text-foreground mb-8">Gestion des Commissions (2%)</h1>

      {/* Stats */}
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
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Montant vente</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Taux</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Commission Scoly</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((commission) => (
                <tr key={commission.id} className="border-t border-border">
                  <td className="py-3 px-4 text-sm">{new Date(commission.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3 px-4">{commission.vendor_settings?.store_name || "-"}</td>
                  <td className="py-3 px-4">{commission.sale_amount.toLocaleString()} FCFA</td>
                  <td className="py-3 px-4">{commission.commission_rate}%</td>
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

// Articles Tab
const ArticlesTab = () => {
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    const { data } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });
    setArticles(data || []);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("articles").update({ status, published_at: status === "published" ? new Date().toISOString() : null }).eq("id", id);
    toast.success(`Article ${status === "published" ? "publié" : "mis en brouillon"}`);
    fetchArticles();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet article ?")) return;
    await supabase.from("articles").delete().eq("id", id);
    toast.success("Article supprimé");
    fetchArticles();
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground mb-8">Modération des Articles (Journal Scoly)</h1>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Titre</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Catégorie</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vues</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Likes</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Premium</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} className="border-t border-border">
                  <td className="py-3 px-4 font-medium max-w-xs truncate">{article.title_fr}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{article.category}</Badge>
                  </td>
                  <td className="py-3 px-4">{article.views || 0}</td>
                  <td className="py-3 px-4">{article.likes || 0}</td>
                  <td className="py-3 px-4">
                    <Badge variant={article.is_premium ? "default" : "secondary"}>
                      {article.is_premium ? "Oui" : "Non"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={article.status === "published" ? "default" : "secondary"}>
                      {article.status === "published" ? "Publié" : "Brouillon"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
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

// Promotions Tab
const PromotionsTab = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discount_percent: "",
    discount_amount: "",
    min_order_amount: "",
    max_uses: "",
    valid_from: "",
    valid_until: "",
    is_active: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons(data || []);
  };

  const handleSubmit = async () => {
    const couponData = {
      code: formData.code.toUpperCase(),
      discount_percent: formData.discount_percent ? parseInt(formData.discount_percent) : null,
      discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : null,
      min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      valid_from: formData.valid_from || new Date().toISOString(),
      valid_until: formData.valid_until || null,
      is_active: formData.is_active,
    };

    const { error } = await supabase.from("coupons").insert(couponData);
    if (error) toast.error("Erreur");
    else { toast.success("Coupon créé"); setIsDialogOpen(false); fetchCoupons(); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("coupons").update({ is_active: !current }).eq("id", id);
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce coupon ?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    fetchCoupons();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground">Promotions & Coupons</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero"><Plus size={18} />Créer un coupon</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau coupon</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>Code *</Label><Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="PROMO2024" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Réduction (%)</Label><Input type="number" value={formData.discount_percent} onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })} /></div>
                <div><Label>Réduction (FCFA)</Label><Input type="number" value={formData.discount_amount} onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Min. commande</Label><Input type="number" value={formData.min_order_amount} onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })} /></div>
                <div><Label>Max. utilisations</Label><Input type="number" value={formData.max_uses} onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Valide à partir du</Label><Input type="date" value={formData.valid_from} onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })} /></div>
                <div><Label>Valide jusqu'au</Label><Input type="date" value={formData.valid_until} onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })} /></div>
              </div>
              <Button onClick={handleSubmit}>Créer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-lg font-bold bg-primary/10 text-primary px-3 py-1 rounded">
                {coupon.code}
              </span>
              <Badge variant={coupon.is_active ? "default" : "secondary"}>
                {coupon.is_active ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              {coupon.discount_percent && <p>Réduction: {coupon.discount_percent}%</p>}
              {coupon.discount_amount && <p>Réduction: {coupon.discount_amount.toLocaleString()} FCFA</p>}
              <p className="text-muted-foreground">Utilisé: {coupon.used_count || 0} / {coupon.max_uses || "∞"}</p>
              {coupon.valid_until && (
                <p className="text-muted-foreground">Expire: {new Date(coupon.valid_until).toLocaleDateString()}</p>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => toggleActive(coupon.id, coupon.is_active)}>
                {coupon.is_active ? "Désactiver" : "Activer"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(coupon.id)}>
                <Trash2 size={14} className="text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;
