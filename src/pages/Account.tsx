import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, ShoppingBag, Settings, LogOut, Package, CheckCircle, Truck, Bell, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  preferred_language: string | null;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  discount_amount: number;
  shipping_address: string | null;
  phone: string | null;
  delivery_received_at: string | null;
  delivery_delivered_at: string | null;
  customer_confirmed_at: string | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const Account = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile>({
    first_name: "",
    last_name: "",
    phone: "",
    preferred_language: language,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
    fetchOrders();
    fetchNotifications();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone: data.phone || "",
          preferred_language: data.preferred_language || language,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          customer_confirmed_at: new Date().toISOString(),
          status: 'delivered'
        })
        .eq('id', orderId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Livraison confirmée",
        description: "Merci d'avoir confirmé la réception de votre commande !",
      });

      fetchOrders();
    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast({
        title: t.common.error,
        description: t.common.tryAgain,
        variant: "destructive",
      });
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          preferred_language: profile.preferred_language,
        });

      if (error) throw error;

      if (profile.preferred_language) {
        setLanguage(profile.preferred_language as 'fr' | 'en' | 'de' | 'es');
      }

      toast({
        title: t.common.success,
        description: t.account.saveChanges,
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: t.common.error,
        description: t.common.tryAgain,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' ' + t.common.currency;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-GB' : 'fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t.account.statusPending;
      case 'confirmed': return t.account.statusConfirmed;
      case 'shipped': return t.account.statusShipped;
      case 'delivered': return t.account.statusDelivered;
      case 'cancelled': return t.account.statusCancelled;
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'shipped': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const canConfirmDelivery = (order: Order) => {
    return order.delivery_delivered_at && !order.customer_confirmed_at;
  };

  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  if (!user) return null;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground">
              {t.account.title}
            </h1>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut size={18} />
              {t.nav.logout}
            </Button>
          </div>

          <Tabs defaultValue="orders" className="space-y-8">
            <TabsList className="bg-card border border-border flex-wrap h-auto p-1">
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ShoppingBag size={18} />
                {t.account.orders}
                {orders.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{orders.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2 relative">
                <Bell size={18} />
                Notifications
                {unreadNotifications > 0 && (
                  <Badge variant="destructive" className="ml-1">{unreadNotifications}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User size={18} />
                {t.account.profile}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings size={18} />
                {t.account.settings}
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-xl font-display font-bold text-foreground mb-6">
                  {t.account.orderHistory}
                </h2>

                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t.account.noOrders}</p>
                    <Button variant="hero" className="mt-4" onClick={() => navigate('/shop')}>
                      Découvrir nos produits
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 sm:p-6 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div>
                            <p className="font-semibold text-foreground flex items-center gap-2">
                              <Package size={18} />
                              Commande #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="font-bold text-primary text-lg">
                              {formatPrice(order.total_amount)}
                            </p>
                            {order.discount_amount > 0 && (
                              <p className="text-xs text-green-600">
                                -{formatPrice(order.discount_amount)} économisé
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Order Status Timeline */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                          
                          {order.delivery_received_at && (
                            <Badge variant="outline" className="text-xs">
                              <Truck size={12} className="mr-1" />
                              Réceptionné par livreur
                            </Badge>
                          )}
                          
                          {order.delivery_delivered_at && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                              <CheckCircle size={12} className="mr-1" />
                              Livré
                            </Badge>
                          )}
                          
                          {order.customer_confirmed_at && (
                            <Badge className="bg-green-500 text-white text-xs">
                              <CheckCircle size={12} className="mr-1" />
                              Réception confirmée
                            </Badge>
                          )}
                        </div>

                        {/* Shipping Address */}
                        {order.shipping_address && (
                          <p className="text-sm text-muted-foreground mb-4">
                            📍 {order.shipping_address}
                          </p>
                        )}

                        {/* Confirm Delivery Button */}
                        {canConfirmDelivery(order) && (
                          <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                            <p className="text-sm text-green-700 dark:text-green-400 mb-3">
                              🎉 Votre commande a été livrée ! Confirmez la réception pour valider.
                            </p>
                            <Button
                              variant="hero"
                              size="sm"
                              onClick={() => handleConfirmDelivery(order.id)}
                            >
                              <CheckCircle size={16} />
                              Confirmer la réception
                            </Button>
                          </div>
                        )}

                        {/* Pending Delivery */}
                        {order.status === 'shipped' && !order.delivery_delivered_at && (
                          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                            <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                              <Truck size={16} className="animate-pulse" />
                              Votre commande est en cours de livraison...
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-xl font-display font-bold text-foreground mb-6">
                  Notifications
                </h2>

                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Aucune notification</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                        className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                          notification.is_read 
                            ? 'border-border bg-muted/30' 
                            : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${
                            notification.type === 'order' ? 'bg-blue-100 text-blue-600' :
                            notification.type === 'delivery' ? 'bg-green-100 text-green-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {notification.type === 'order' ? <ShoppingBag size={16} /> :
                             notification.type === 'delivery' ? <Truck size={16} /> :
                             <Bell size={16} />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{notification.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <Clock size={12} />
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-xl font-display font-bold text-foreground mb-6">
                  {t.account.editProfile}
                </h2>

                {loading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-muted rounded" />
                    <div className="h-10 bg-muted rounded" />
                    <div className="h-10 bg-muted rounded" />
                  </div>
                ) : (
                  <div className="space-y-6 max-w-md">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">{t.auth.firstName}</Label>
                        <Input
                          id="firstName"
                          value={profile.first_name || ""}
                          onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">{t.auth.lastName}</Label>
                        <Input
                          id="lastName"
                          value={profile.last_name || ""}
                          onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">{t.auth.email}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user.email || ""}
                        disabled
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">{t.auth.phone}</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profile.phone || ""}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <Button variant="hero" onClick={handleSaveProfile} disabled={saving}>
                      {saving ? t.common.loading : t.account.saveChanges}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-xl font-display font-bold text-foreground mb-6">
                  {t.account.settings}
                </h2>

                <div className="space-y-6 max-w-md">
                  <div>
                    <Label htmlFor="language">{t.account.language}</Label>
                    <select
                      id="language"
                      value={profile.preferred_language || language}
                      onChange={(e) => setProfile({ ...profile, preferred_language: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="de">Deutsch</option>
                      <option value="es">Español</option>
                    </select>
                  </div>

                  <Button variant="hero" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? t.common.loading : t.account.saveChanges}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default Account;