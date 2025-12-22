import { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingBag, 
  Users, 
  DollarSign,
  Download,
  RefreshCw,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface StatsData {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10B981', '#F59E0B', '#8B5CF6'];

const AdminDashboard = () => {
  const [stats, setStats] = useState<StatsData>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7' | '30' | '90' | '365'>('30');

  useEffect(() => {
    fetchAllData();
  }, [period]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchMonthlyData(),
      fetchTopProducts(),
      fetchCategoryData(),
      fetchRecentOrders(),
    ]);
    setLoading(false);
  };

  const fetchStats = async () => {
    const [products, orders, users, payments] = await Promise.all([
      supabase.from("products").select("id", { count: "exact" }).eq("is_active", true),
      supabase.from("orders").select("total_amount, status, created_at"),
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("payments").select("amount, status").eq("status", "completed"),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const ordersData = orders.data || [];
    const totalRevenue = ordersData
      .filter(o => o.status === 'delivered')
      .reduce((acc, o) => acc + (o.total_amount || 0), 0);
    
    const monthlyRevenue = ordersData
      .filter(o => new Date(o.created_at) >= startOfMonth)
      .reduce((acc, o) => acc + (o.total_amount || 0), 0);

    const pendingOrders = ordersData.filter(o => o.status === 'pending').length;
    const deliveredOrders = ordersData.filter(o => o.status === 'delivered').length;
    const cancelledOrders = ordersData.filter(o => o.status === 'cancelled').length;

    setStats({
      totalProducts: products.count || 0,
      totalOrders: ordersData.length,
      totalUsers: users.count || 0,
      totalRevenue,
      monthlyRevenue,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
    });
  };

  const fetchMonthlyData = async () => {
    const { data: orders } = await supabase
      .from("orders")
      .select("total_amount, created_at, status")
      .order("created_at", { ascending: true });

    if (!orders) return;

    // Group by month
    const monthlyMap = new Map<string, { revenue: number; orders: number }>();
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    orders.forEach(order => {
      const date = new Date(order.created_at);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      
      const existing = monthlyMap.get(monthKey) || { revenue: 0, orders: 0 };
      monthlyMap.set(monthKey, {
        revenue: existing.revenue + (order.status === 'delivered' ? order.total_amount : 0),
        orders: existing.orders + 1,
      });
    });

    // Get last 6 months
    const result: MonthlyData[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      const data = monthlyMap.get(monthKey) || { revenue: 0, orders: 0 };
      result.push({
        month: months[date.getMonth()],
        revenue: data.revenue,
        orders: data.orders,
      });
    }

    setMonthlyData(result);
  };

  const fetchTopProducts = async () => {
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_name, quantity, total_price");

    if (!orderItems) return;

    // Aggregate by product name
    const productMap = new Map<string, { sales: number; revenue: number }>();
    orderItems.forEach(item => {
      const existing = productMap.get(item.product_name) || { sales: 0, revenue: 0 };
      productMap.set(item.product_name, {
        sales: existing.sales + item.quantity,
        revenue: existing.revenue + item.total_price,
      });
    });

    // Sort by revenue and get top 5
    const sorted = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setTopProducts(sorted);
  };

  const fetchCategoryData = async () => {
    const { data: products } = await supabase
      .from("products")
      .select("category_id, categories(name_fr)")
      .eq("is_active", true);

    if (!products) return;

    const categoryMap = new Map<string, number>();
    products.forEach(product => {
      const catName = (product.categories as any)?.name_fr || 'Sans catégorie';
      categoryMap.set(catName, (categoryMap.get(catName) || 0) + 1);
    });

    const result: CategoryData[] = Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }))
      .slice(0, 5);

    setCategoryData(result);
  };

  const fetchRecentOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    setRecentOrders(data || []);
  };

  const exportToCSV = () => {
    const headers = ['Mois', 'Revenus (FCFA)', 'Commandes'];
    const rows = monthlyData.map(d => [d.month, d.revenue, d.orders]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `scoly-stats-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const statusLabels: Record<string, string> = {
    pending: "En attente",
    confirmed: "Confirmée",
    shipped: "Expédiée",
    delivered: "Livrée",
    cancelled: "Annulée",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground">Vue d'ensemble de votre activité</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">3 derniers mois</SelectItem>
              <SelectItem value="365">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchAllData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Revenus totaux"
          value={formatCurrency(stats.totalRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          trend={12}
          color="primary"
        />
        <StatsCard
          title="Revenus ce mois"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={8}
          color="green"
        />
        <StatsCard
          title="Commandes"
          value={stats.totalOrders.toString()}
          subtitle={`${stats.pendingOrders} en attente`}
          icon={<ShoppingBag className="h-5 w-5" />}
          color="blue"
        />
        <StatsCard
          title="Utilisateurs"
          value={stats.totalUsers.toString()}
          icon={<Users className="h-5 w-5" />}
          trend={5}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenus mensuels</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), "Revenus"]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Évolution des commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => [value, "Commandes"]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Produits les plus vendus</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucune vente enregistrée</p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                      index === 0 ? "bg-yellow-500" : 
                      index === 1 ? "bg-gray-400" :
                      index === 2 ? "bg-amber-600" : "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.sales} vendus</p>
                    </div>
                    <p className="font-semibold text-primary">{formatCurrency(product.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucun produit</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, "Produits"]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dernières commandes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Montant</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border">
                    <td className="py-3 px-4 text-sm font-mono">{order.id.slice(0, 8)}...</td>
                    <td className="py-3 px-4 text-sm">{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="py-3 px-4 text-sm">{order.phone || "-"}</td>
                    <td className="py-3 px-4 text-sm font-medium">{order.total_amount?.toLocaleString()} FCFA</td>
                    <td className="py-3 px-4">
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColors[order.status] || "")}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucune commande
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  color: 'primary' | 'green' | 'blue' | 'purple';
}

const StatsCard = ({ title, value, subtitle, icon, trend, color }: StatsCardProps) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-500/10 text-green-500',
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className={cn("p-2 rounded-lg", colorClasses[color])}>
            {icon}
          </div>
          {trend !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{subtitle || title}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;
