import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const BootstrapAdmin = () => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleBootstrap = async () => {
    if (!token.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer le token d'administration",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke('bootstrap-admin', {
        body: { token: token.trim() }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setSuccess(true);
        toast({
          title: "Succès !",
          description: "Le compte super admin a été créé avec succès.",
        });
      } else {
        throw new Error(data?.error || "Erreur lors de la création du compte");
      }
    } catch (err: any) {
      console.error("Bootstrap error:", err);
      setError(err.message || "Une erreur est survenue");
      toast({
        title: "Erreur",
        description: err.message || "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md">
            <CardContent className="pt-8 pb-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Compte Super Admin Créé !
              </h2>
              <p className="text-muted-foreground mb-6">
                Vous pouvez maintenant vous connecter avec les identifiants suivants :
              </p>
              <div className="bg-muted p-4 rounded-lg text-left space-y-2 mb-6">
                <p><strong>Email :</strong> admin@scoly.ci</p>
                <p><strong>Mot de passe :</strong> ScolyAdmin2024!</p>
              </div>
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="w-full"
              >
                Aller à la page de connexion
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-2">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <ShieldCheck className="h-8 w-8 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl font-display">
              Configuration Super Admin
            </CardTitle>
            <CardDescription>
              Créez le compte administrateur principal pour Izy-scoly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="token">Token d'administration</Label>
              <Input
                id="token"
                type="password"
                placeholder="Entrez le token secret..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={loading}
                className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground">
                Ce token est défini dans les secrets Supabase (BOOTSTRAP_ADMIN_TOKEN)
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg"
              >
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            <Button
              onClick={handleBootstrap}
              disabled={loading || !token.trim()}
              className="w-full transition-all duration-300 hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Créer le compte Super Admin
                </>
              )}
            </Button>

            <div className="pt-4 border-t">
              <p className="text-xs text-center text-muted-foreground">
                Cette action créera un compte avec les identifiants :<br />
                <strong>admin@scoly.ci</strong> / <strong>ScolyAdmin2024!</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default BootstrapAdmin;
