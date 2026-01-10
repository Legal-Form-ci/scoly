import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Truck, CheckCircle, Clock, MapPin, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_address: string;
  phone: string;
  delivery_received_at: string | null;
  delivery_delivered_at: string | null;
  customer_confirmed_at: string | null;
}

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkAccess();
  }, [user, navigate]);

  const checkAccess = async () => {
    if (!user) return;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isDelivery = roles?.some((r) => r.role === "admin" || r.role === "moderator" || r.role === "vendor");
    setHasAccess(!!isDelivery);

    if (isDelivery) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("delivery_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (orderId: string, action: "received" | "delivered") => {
    try {
      const updates: any = {};
      
      if (action === "received") {
        updates.delivery_received_at = new Date().toISOString();
        updates.status = "shipped";
      } else if (action === "delivered") {
        updates.delivery_delivered_at = new Date().toISOString();
        updates.status = "delivered";
      }

      const { error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: action === "received" ? "Commande marquée comme réceptionnée" : "Commande marquée comme livrée",
      });

      // Send email notification
      if (action === "delivered") {
        await supabase.functions.invoke("send-order-email", {
          body: { orderId, emailType: "delivered" },
        });
      }

      fetchOrders();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (order: Order) => {
    if (order.customer_confirmed_at) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Confirmée par client</span>;
    }
    if (order.delivery_delivered_at) {
      return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Livrée</span>;
    }
    if (order.delivery_received_at) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">En livraison</span>;
    }
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">À réceptionner</span>;
  };

  const pendingOrders = orders.filter((o) => !o.delivery_received_at);
  const inProgressOrders = orders.filter((o) => o.delivery_received_at && !o.delivery_delivered_at);
  const deliveredOrders = orders.filter((o) => o.delivery_delivered_at);

  if (!hasAccess) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-12 container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Accès refusé</h1>
          <p className="text-muted-foreground">Vous n'avez pas les droits d'accès à cet espace.</p>
          <Button variant="hero" onClick={() => navigate("/")} className="mt-6">
            Retour à l'accueil
          </Button>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Espace Livreur
          </h1>
          <p className="text-muted-foreground mb-8">Gérez vos livraisons assignées</p>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingOrders.length}</p>
                    <p className="text-sm text-muted-foreground">À réceptionner</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{inProgressOrders.length}</p>
                    <p className="text-sm text-muted-foreground">En livraison</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{deliveredOrders.length}</p>
                    <p className="text-sm text-muted-foreground">Livrées</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Tabs */}
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                <Clock size={16} />
                À réceptionner ({pendingOrders.length})
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="gap-2">
                <Truck size={16} />
                En livraison ({inProgressOrders.length})
              </TabsTrigger>
              <TabsTrigger value="delivered" className="gap-2">
                <CheckCircle size={16} />
                Livrées ({deliveredOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <div className="grid gap-4">
                {pendingOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onReceive={() => updateDeliveryStatus(order.id, "received")}
                    formatPrice={formatPrice}
                    formatDate={formatDate}
                    getStatusBadge={getStatusBadge}
                    showReceiveButton
                  />
                ))}
                {pendingOrders.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Aucune commande à réceptionner</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="in_progress">
              <div className="grid gap-4">
                {inProgressOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onDeliver={() => updateDeliveryStatus(order.id, "delivered")}
                    formatPrice={formatPrice}
                    formatDate={formatDate}
                    getStatusBadge={getStatusBadge}
                    showDeliverButton
                  />
                ))}
                {inProgressOrders.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Aucune commande en livraison</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="delivered">
              <div className="grid gap-4">
                {deliveredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    formatPrice={formatPrice}
                    formatDate={formatDate}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
                {deliveredOrders.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Aucune commande livrée</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </main>
  );
};

interface OrderCardProps {
  order: Order;
  onReceive?: () => void;
  onDeliver?: () => void;
  formatPrice: (price: number) => string;
  formatDate: (date: string) => string;
  getStatusBadge: (order: Order) => JSX.Element;
  showReceiveButton?: boolean;
  showDeliverButton?: boolean;
}

const OrderCard = ({
  order,
  onReceive,
  onDeliver,
  formatPrice,
  formatDate,
  getStatusBadge,
  showReceiveButton,
  showDeliverButton,
}: OrderCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-primary" />
              <span className="font-semibold">#{order.id.slice(0, 8).toUpperCase()}</span>
              {getStatusBadge(order)}
            </div>
            <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
            <p className="text-lg font-bold text-primary">{formatPrice(order.total_amount)}</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User size={16} />
              <span>Client</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone size={16} />
              <a href={`tel:${order.phone}`} className="hover:text-primary">
                {order.phone}
              </a>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin size={16} className="mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{order.shipping_address}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {showReceiveButton && (
              <Button variant="hero" onClick={onReceive}>
                <Package size={18} />
                Marquer réceptionnée
              </Button>
            )}
            {showDeliverButton && (
              <Button variant="hero" onClick={onDeliver}>
                <CheckCircle size={18} />
                Marquer livrée
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryDashboard;
