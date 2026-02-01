import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Eye, EyeOff, Database, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DatabaseManagement from "@/components/admin/DatabaseManagement";
import { useAuth } from "@/contexts/AuthContext";

// The password is verified client-side but obfuscated
// For maximum security in production, this check should happen server-side
const SYSTEM_PASSWORD_HASH = "QEthYmxFdGlnTmVGZWxJY1Njb2x5MjAzMEA="; // base64 of the password

export default function SystemDatabase() {
  const { user, loading, rolesLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [blockTimeout, setBlockTimeout] = useState<number | null>(null);

  // Check if user is already authenticated via sessionStorage (for this browser session only)
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("db_portal_auth");
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

  // Handle brute-force protection
  useEffect(() => {
    if (attempts >= 5 && !blocked) {
      setBlocked(true);
      setBlockTimeout(300); // 5 minutes
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

  const verifyPassword = () => {
    if (blocked) {
      toast.error(`Trop de tentatives. Réessayez dans ${Math.ceil((blockTimeout || 0) / 60)} minute(s).`);
      return;
    }

    // Decode the expected password and compare
    const expected = atob(SYSTEM_PASSWORD_HASH);
    if (password === expected) {
      setAuthenticated(true);
      sessionStorage.setItem("db_portal_auth", "verified");
      toast.success("Accès autorisé au portail de base de données");
    } else {
      setAttempts((prev) => prev + 1);
      toast.error(`Mot de passe incorrect. Tentative ${attempts + 1}/5`);
      setPassword("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      verifyPassword();
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

  // Password gate
  if (!authenticated) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md shadow-2xl border-2">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-display">
                Accès Sécurisé
              </CardTitle>
              <CardDescription>
                Portail de gestion de base de données isolé
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Zone Restreinte</p>
                    <p className="text-muted-foreground mt-1">
                      Cette section permet d'effectuer des opérations critiques sur la base de données. 
                      Un mot de passe système est requis.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="system-password">Mot de passe système</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="system-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={blocked}
                    className="pl-10 pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={blocked}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {blocked && (
                  <p className="text-sm text-destructive">
                    Trop de tentatives. Réessayez dans {Math.floor((blockTimeout || 0) / 60)}:{String((blockTimeout || 0) % 60).padStart(2, '0')}
                  </p>
                )}
              </div>

              <Button
                onClick={verifyPassword}
                disabled={!password.trim() || blocked}
                className="w-full gap-2"
              >
                <Database size={18} />
                Accéder au Portail
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Toutes les actions sont journalisées pour des raisons de sécurité.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Authenticated - show database management
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <DatabaseManagement />
        </div>
      </div>
      <Footer />
    </main>
  );
}
