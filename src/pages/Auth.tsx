import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import { z } from "zod";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState(""); // email or username
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const loginSchema = z.object({
    identifier: z.string().min(1, t.common.required),
    password: z.string().min(6, t.common.required),
  });

  const signupSchema = z.object({
    email: z.string().email(t.common.error).max(255),
    password: z.string().min(6, t.common.required),
    confirmPassword: z.string(),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    username: z.string().min(3).max(50).optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t.common.error,
    path: ["confirmPassword"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isLogin) {
        const result = loginSchema.safeParse({ identifier, password });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0].toString()] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        // Check if identifier is email or username
        let loginEmail = identifier;
        
        // If not an email, try to find the user by username in profiles
        if (!identifier.includes('@')) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('username', identifier)
            .maybeSingle();
          
          if (profile?.email) {
            loginEmail = profile.email;
          } else if (profile?.id) {
            // User has username but no email stored - can't login by username yet
            setErrors({ identifier: "Connectez-vous avec votre email. Le nom d'utilisateur sera disponible après votre première connexion." });
            setLoading(false);
            return;
          } else {
            setErrors({ identifier: "Utilisateur non trouvé" });
            setLoading(false);
            return;
          }
        }

        const { error } = await signIn(loginEmail, password);
        if (!error) {
          // Update profile with email on successful login
          const { data: { user: loggedUser } } = await supabase.auth.getUser();
          if (loggedUser?.email) {
            await supabase
              .from('profiles')
              .update({ email: loggedUser.email })
              .eq('id', loggedUser.id);
          }
          navigate("/");
        }
      } else {
        const result = signupSchema.safeParse({
          email,
          password,
          confirmPassword,
          firstName,
          lastName,
          username,
        });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0].toString()] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, firstName, lastName);
        if (!error) {
          // Update username if provided
          if (username) {
            const { data: { user: newUser } } = await supabase.auth.getUser();
            if (newUser) {
              await supabase
                .from('profiles')
                .update({ username })
                .eq('id', newUser.id);
            }
          }
          navigate("/");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-display font-bold text-center text-foreground mb-2">
            {isLogin ? t.auth.loginTitle : t.auth.signupTitle}
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            {isLogin ? "Connectez-vous à votre compte Izy-scoly" : "Créez votre compte Izy-scoly"}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{t.auth.firstName}</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-10"
                        placeholder="Innocent"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-sm text-destructive mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">{t.auth.lastName}</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="pl-10"
                        placeholder="KOFFI"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="text-sm text-destructive mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <div className="relative mt-1">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      placeholder="innocent_koffi"
                    />
                  </div>
                  {errors.username && (
                    <p className="text-sm text-destructive mt-1">{errors.username}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">{t.auth.email}</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder="innocent.koffi@email.ci"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email}</p>
                  )}
                </div>
              </>
            )}

            {isLogin && (
              <div>
                <Label htmlFor="identifier">Email ou nom d'utilisateur</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pl-10"
                    placeholder="email@example.ci ou Admin"
                    required
                  />
                </div>
                {errors.identifier && (
                  <p className="text-sm text-destructive mt-1">{errors.identifier}</p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="password">{t.auth.password}</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password}</p>
              )}
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-end">
                <button type="button" className="text-sm text-primary hover:underline">
                  {t.auth.forgotPassword}
                </button>
              </div>
            )}

            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? t.common.loading : isLogin ? t.auth.loginButton : t.auth.signupButton}
            </Button>
          </form>

          {/* Toggle */}
          <p className="text-center text-muted-foreground mt-6">
            {isLogin ? t.auth.noAccount : t.auth.hasAccount}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? t.auth.signupButton : t.auth.loginButton}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;