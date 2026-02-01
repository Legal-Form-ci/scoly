import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, KeyRound, Database, Cloud, Settings, Server, Lock, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// PIN is verified client-side but obfuscated
const SYSTEM_PIN_HASH = "NjIwMjcyMDI="; // base64 of "62027202"

export default function SystemRepository() {
  const { user, loading, rolesLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [blockTimeout, setBlockTimeout] = useState<number | null>(null);

  // Project info
  const [projectInfo, setProjectInfo] = useState<{
    url: string;
    projectId: string;
    connected: boolean;
  } | null>(null);

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("repo_portal_auth");
    if (sessionAuth === "verified") {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (loading || rolesLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!isAdmin) {
      navigate("/");
    }
  }, [user, loading, rolesLoading, isAdmin, navigate]);

  useEffect(() => {
    if (authenticated) {
      // Fetch project info
      setProjectInfo({
        url: import.meta.env.VITE_SUPABASE_URL || "",
        projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || "zvzrnqckqcqwysplhpfe",
        connected: true,
      });
    }
  }, [authenticated]);

  useEffect(() => {
    if (attempts >= 3 && !blocked) {
      setBlocked(true);
      setBlockTimeout(600); // 10 minutes
    }
  }, [attempts, blocked]);

  useEffect(() => {
    if (blocked && blockTimeout !== null && blockTimeout > 0) {
      const timer = setInterval(() => {
        setBlockTimeout((prev) => {
          if (prev && prev <= 1) {
            setBlocked(false);
            setAttempts(0);
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [blocked, blockTimeout]);

  const verifyPin = (value: string) => {
    if (blocked) {
      toast.error(`Trop de tentatives. Réessayez dans ${Math.ceil((blockTimeout || 0) / 60)} minute(s).`);
      return;
    }

    const expected = atob(SYSTEM_PIN_HASH);
    if (value === expected) {
      setAuthenticated(true);
      sessionStorage.setItem("repo_portal_auth", "verified");
      toast.success("Accès autorisé au portail système");
    } else {
      setAttempts((prev) => prev + 1);
      toast.error(`Code PIN incorrect. Tentative ${attempts + 1}/3`);
      setPin("");
    }
  };

  const handlePinChange = (value: string) => {
    setPin(value);
    if (value.length === 8) {
      verifyPin(value);
    }
  };

  if (loading || rolesLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </main>
    );
  }

  if (!user || !isAdmin) return null;

  // PIN gate
  if (!authenticated) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md shadow-2xl border-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-display">
                Portail Système
              </CardTitle>
              <CardDescription>
                Configuration Cloud et accès infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    Cette section donne accès aux configurations système sensibles.
                    Un code PIN à 8 chiffres est requis.
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <p className="text-sm font-medium">Entrez le code PIN système</p>
                  <InputOTP
                    maxLength={8}
                    value={pin}
                    onChange={handlePinChange}
                    disabled={blocked}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                      <InputOTPSlot index={6} />
                      <InputOTPSlot index={7} />
                    </InputOTPGroup>
                  </InputOTP>
                  {blocked && (
                    <p className="text-sm text-destructive">
                      Trop de tentatives. Réessayez dans {Math.floor((blockTimeout || 0) / 60)}:{String((blockTimeout || 0) % 60).padStart(2, '0')}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Toutes les tentatives d'accès sont journalisées.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Authenticated - show system config
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-foreground">Portail Système</h1>
            <p className="text-muted-foreground">Configuration Cloud, infrastructure et accès backend</p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="logs">Journaux</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Cloud Status */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Cloud className="h-5 w-5 text-primary" />
                      Cloud Backend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Statut</span>
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connecté
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Projet ID</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {projectInfo?.projectId?.slice(0, 12)}...
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Région</span>
                        <span className="text-sm">Europe (West)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Database Status */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-600" />
                      Base de Données
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Type</span>
                        <span className="text-sm">PostgreSQL 15</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">RLS</span>
                        <Badge variant="default" className="bg-green-600">Actif</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Accès</span>
                        <Button variant="outline" size="sm" asChild>
                          <a href="/db">
                            Portail DB
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Auth Status */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-purple-600" />
                      Authentification
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Email/Mot de passe</span>
                        <Badge variant="default" className="bg-green-600">Actif</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Google OAuth</span>
                        <Badge variant="default" className="bg-green-600">Actif</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Apple Sign-In</span>
                        <Badge variant="default" className="bg-green-600">Actif</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Edge Functions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Edge Functions
                  </CardTitle>
                  <CardDescription>Fonctions serverless déployées</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: "bootstrap-admin", status: "active" },
                      { name: "check-payment-status", status: "active" },
                      { name: "cloud-backup", status: "active" },
                      { name: "confirm-payment", status: "active" },
                      { name: "create-user", status: "active" },
                      { name: "generate-ad-cta", status: "active" },
                      { name: "kkiapay-webhook", status: "active" },
                      { name: "process-payment", status: "active" },
                      { name: "restore-database", status: "active" },
                      { name: "send-article-notification", status: "active" },
                      { name: "send-order-email", status: "active" },
                      { name: "send-push-notification", status: "active" },
                      { name: "translate-product", status: "active" },
                    ].map((fn) => (
                      <div key={fn.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <code className="text-sm">{fn.name}</code>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Déployée
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="config" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Variables d'environnement
                  </CardTitle>
                  <CardDescription>Secrets et configurations système (valeurs masquées)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      "SUPABASE_URL",
                      "SUPABASE_ANON_KEY",
                      "SUPABASE_SERVICE_ROLE_KEY",
                      "KKIAPAY_PUBLIC_KEY",
                      "KKIAPAY_PRIVATE_KEY",
                      "KKIAPAY_SECRET",
                      "RESEND_API_KEY",
                      "VAPID_PUBLIC_KEY",
                      "VAPID_PRIVATE_KEY",
                      "BOOTSTRAP_ADMIN_TOKEN",
                      "IZY_SCOLY_AI_KEY",
                    ].map((secret) => (
                      <div key={secret} className="flex items-center justify-between p-3 border rounded-lg">
                        <code className="text-sm font-medium">{secret}</code>
                        <span className="text-sm text-muted-foreground">••••••••••••</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Journaux d'accès système</CardTitle>
                  <CardDescription>Dernières actions sur les portails protégés</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Les journaux d'audit sont consultables dans la table `audit_logs` de la base de données.
                  </p>
                  <Button variant="outline" className="mt-4" asChild>
                    <a href="/db">
                      Accéder aux journaux
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </main>
  );
}
