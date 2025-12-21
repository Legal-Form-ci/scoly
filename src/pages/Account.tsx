import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, ShoppingBag, Heart, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
    fetchOrders();
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
    return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-GB' : 'fr-FR');
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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

          <Tabs defaultValue="profile" className="space-y-8">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User size={18} />
                {t.account.profile}
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ShoppingBag size={18} />
                {t.account.orders}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings size={18} />
                {t.account.settings}
              </TabsTrigger>
            </TabsList>

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
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-foreground">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            {formatPrice(order.total_amount)}
                          </p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                      </div>
                    ))}
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
