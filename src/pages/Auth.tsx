import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, AtSign, AlertTriangle, CheckCircle, Chrome, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import { z } from "zod";
import { toast } from "sonner";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useLoginSecurity } from "@/hooks/useLoginSecurity";

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
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; checks: boolean[] }>({ score: 0, checks: [] });

  const { signIn, signUp, user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  // Rate limiting for login/signup
  const loginRateLimit = useRateLimit('auth_login', { maxAttempts: 5, windowSeconds: 300, blockSeconds: 900 });
  const signupRateLimit = useRateLimit('auth_signup', { maxAttempts: 3, windowSeconds: 600, blockSeconds: 1800 });
  const { recordLoginSession } = useLoginSecurity();

  const redirectToDashboard = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', u.id);

    const roleList = (roles || []).map((r) => r.role);
    const path = roleList.includes('admin')
      ? '/admin'
      : roleList.includes('moderator')
        ? '/moderator'
        : roleList.includes('vendor')
          ? '/vendor'
          : roleList.includes('delivery')
            ? '/delivery'
            : '/account';

    navigate(path);
  };

  useEffect(() => {
    if (user) {
      redirectToDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Enhanced password validation rules
  const passwordRules = {
    minLength: 8,
    hasUppercase: /[A-Z]/,
    hasLowercase: /[a-z]/,
    hasNumber: /[0-9]/,
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/,
  };

  const passwordMessages = {
    fr: {
      minLength: "Au moins 8 caractères",
      hasUppercase: "Au moins une majuscule",
      hasLowercase: "Au moins une minuscule", 
      hasNumber: "Au moins un chiffre",
      hasSpecial: "Au moins un caractère spécial (!@#$%...)",
      leaked: "Ce mot de passe a été compromis. Choisissez-en un autre.",
      weak: "Mot de passe trop faible",
      medium: "Mot de passe moyen",
      strong: "Mot de passe fort",
      mismatch: "Les mots de passe ne correspondent pas",
    },
    en: {
      minLength: "At least 8 characters",
      hasUppercase: "At least one uppercase letter",
      hasLowercase: "At least one lowercase letter",
      hasNumber: "At least one number",
      hasSpecial: "At least one special character (!@#$%...)",
      leaked: "This password has been compromised. Please choose another.",
      weak: "Weak password",
      medium: "Medium password",
      strong: "Strong password",
      mismatch: "Passwords do not match",
    },
    de: {
      minLength: "Mindestens 8 Zeichen",
      hasUppercase: "Mindestens ein Großbuchstabe",
      hasLowercase: "Mindestens ein Kleinbuchstabe",
      hasNumber: "Mindestens eine Zahl",
      hasSpecial: "Mindestens ein Sonderzeichen (!@#$%...)",
      leaked: "Dieses Passwort wurde kompromittiert. Wählen Sie ein anderes.",
      weak: "Schwaches Passwort",
      medium: "Mittleres Passwort",
      strong: "Starkes Passwort",
      mismatch: "Passwörter stimmen nicht überein",
    },
    es: {
      minLength: "Al menos 8 caracteres",
      hasUppercase: "Al menos una mayúscula",
      hasLowercase: "Al menos una minúscula",
      hasNumber: "Al menos un número",
      hasSpecial: "Al menos un carácter especial (!@#$%...)",
      leaked: "Esta contraseña ha sido comprometida. Elija otra.",
      weak: "Contraseña débil",
      medium: "Contraseña media",
      strong: "Contraseña fuerte",
      mismatch: "Las contraseñas no coinciden",
    },
  };

  const pwdMsg = passwordMessages[language] || passwordMessages.fr;

  // Check password strength in real-time
  useEffect(() => {
    if (!isLogin && password) {
      const checks = [
        password.length >= passwordRules.minLength,
        passwordRules.hasUppercase.test(password),
        passwordRules.hasLowercase.test(password),
        passwordRules.hasNumber.test(password),
        passwordRules.hasSpecial.test(password),
      ];
      const score = checks.filter(Boolean).length;
      setPasswordStrength({ score, checks });
    }
  }, [password, isLogin]);

  const getPasswordStrengthLabel = () => {
    if (passwordStrength.score <= 2) return { label: pwdMsg.weak, color: "text-destructive" };
    if (passwordStrength.score <= 3) return { label: pwdMsg.medium, color: "text-yellow-600" };
    return { label: pwdMsg.strong, color: "text-green-600" };
  };

  const loginSchema = z.object({
    identifier: z.string().min(1, t.common.required),
    password: z.string().min(1, t.common.required),
  });

  const signupSchema = z.object({
    email: z.string().email(t.common.error).max(255),
    password: z.string()
      .min(8, pwdMsg.minLength)
      .refine((val) => passwordRules.hasUppercase.test(val), pwdMsg.hasUppercase)
      .refine((val) => passwordRules.hasLowercase.test(val), pwdMsg.hasLowercase)
      .refine((val) => passwordRules.hasNumber.test(val), pwdMsg.hasNumber)
      .refine((val) => passwordRules.hasSpecial.test(val), pwdMsg.hasSpecial),
    confirmPassword: z.string(),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    username: z.string().min(3).max(50).optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: pwdMsg.mismatch,
    path: ["confirmPassword"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Check rate limit first
      const rateLimit = isLogin ? loginRateLimit : signupRateLimit;
      const rateLimitResult = await rateLimit.checkRateLimit();
      
      if (!rateLimitResult.allowed) {
        const blockedMessage = rateLimitResult.blockedUntil 
          ? `Trop de tentatives. Réessayez dans ${rateLimit.formatBlockedTime(rateLimitResult.blockedUntil)}.`
          : "Trop de tentatives. Veuillez réessayer plus tard.";
        toast.error(blockedMessage);
        setLoading(false);
        return;
      }

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
             
             // Record login session for security tracking
             await recordLoginSession(loggedUser.id);
           }
           await redirectToDashboard();
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
           await redirectToDashboard();
         }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { lovable } = await import("@/integrations/lovable/index");
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error("Erreur de connexion avec Google");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      const { lovable } = await import("@/integrations/lovable/index");
      const { error } = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Apple login error:', error);
      toast.error("Erreur de connexion avec Apple");
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
              
              {/* Password Strength Indicator */}
              {!isLogin && password && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= passwordStrength.score
                            ? passwordStrength.score <= 2
                              ? "bg-destructive"
                              : passwordStrength.score <= 3
                              ? "bg-yellow-500"
                              : "bg-green-500"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${getPasswordStrengthLabel().color}`}>
                    {getPasswordStrengthLabel().label}
                  </p>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    {[
                      { check: passwordStrength.checks[0], label: pwdMsg.minLength },
                      { check: passwordStrength.checks[1], label: pwdMsg.hasUppercase },
                      { check: passwordStrength.checks[2], label: pwdMsg.hasLowercase },
                      { check: passwordStrength.checks[3], label: pwdMsg.hasNumber },
                      { check: passwordStrength.checks[4], label: pwdMsg.hasSpecial },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        {item.check ? (
                          <CheckCircle size={12} className="text-green-500" />
                        ) : (
                          <AlertTriangle size={12} className="text-muted-foreground" />
                        )}
                        <span className={item.check ? "text-green-600" : "text-muted-foreground"}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
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

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground">ou</span>
              <Separator className="flex-1" />
            </div>

            {/* Social Login */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  <path fill="none" d="M1 1h22v22H1z" />
                </svg>
                Continuer avec Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleAppleLogin}
                disabled={loading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continuer avec Apple
              </Button>
            </div>
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