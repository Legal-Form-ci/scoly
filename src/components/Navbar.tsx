import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingCart, User, LogOut, Search, Truck, Store, Shield, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationBell from "./NotificationBell";
import GlobalSearch from "./GlobalSearch";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { t } = useLanguage();
  const { user, signOut, isAdmin, roles, getDashboardPath } = useAuth();
  const { itemCount: cartCount } = useCart();
  const navigate = useNavigate();

  const navItems = [
    { label: "Boutique", href: "/shop" },
    { label: "Actualités", href: "/actualites" },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.contact, href: "/contact" },
  ];

  // Détermine les liens selon les rôles
  const isVendor = roles.includes('vendor');
  const isModerator = roles.includes('moderator');
  const isDelivery = roles.includes('delivery');

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Redirection auto post-connexion vers le bon tableau de bord
  useEffect(() => {
    // Cette logique est gérée dans Auth.tsx, ici c'est juste pour afficher les bons liens
  }, [roles]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Logo showSlogan={false} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-foreground/80 hover:text-primary font-medium transition-colors text-sm"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Search - Desktop */}
          <div className="hidden md:block flex-1 max-w-md mx-4">
            <GlobalSearch />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Search Toggle - Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search size={20} />
            </Button>
            
            <LanguageSwitcher />
            
            {/* Cart */}
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {user ? (
              <>
                <NotificationBell />
                <div className="hidden sm:flex items-center gap-2">
                  {/* Liens selon les rôles */}
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Shield size={16} />
                        Admin
                      </Button>
                    </Link>
                  )}
                  {isVendor && !isAdmin && (
                    <Link to="/vendor">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Store size={16} />
                        Vendeur
                      </Button>
                    </Link>
                  )}
                  {isModerator && !isAdmin && (
                    <Link to="/moderator">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Shield size={16} />
                        Modérateur
                      </Button>
                    </Link>
                  )}
                  {isDelivery && !isAdmin && (
                    <Link to="/delivery">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Truck size={16} />
                        Livreur
                      </Button>
                    </Link>
                  )}
                  <Link to="/account">
                    <Button variant="ghost" size="icon">
                      <User size={20} />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut size={20} />
                  </Button>
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    {t.nav.login}
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button size="sm">
                    {t.nav.signup}
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <div className="md:hidden py-3 border-t border-border">
            <GlobalSearch />
          </div>
        )}

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link
                    to="/account"
                    className="px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <User size={18} />
                    {t.nav.myAccount}
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                      onClick={() => setIsOpen(false)}
                    >
                      <Shield size={18} />
                      Administration
                    </Link>
                  )}
                  {isVendor && !isAdmin && (
                    <Link
                      to="/vendor"
                      className="px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                      onClick={() => setIsOpen(false)}
                    >
                      <Store size={18} />
                      Espace Vendeur
                    </Link>
                  )}
                  {isModerator && !isAdmin && (
                    <Link
                      to="/moderator"
                      className="px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                      onClick={() => setIsOpen(false)}
                    >
                      <Shield size={18} />
                      Espace Modérateur
                    </Link>
                  )}
                  {isDelivery && !isAdmin && (
                    <Link
                      to="/delivery"
                      className="px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                      onClick={() => setIsOpen(false)}
                    >
                      <Truck size={18} />
                      Espace Livreur
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors text-left flex items-center gap-2"
                  >
                    <LogOut size={18} />
                    {t.nav.logout}
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 px-4 pt-2">
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full">
                      {t.nav.login}
                    </Button>
                  </Link>
                  <Link to="/auth?mode=signup" onClick={() => setIsOpen(false)}>
                    <Button className="w-full">
                      {t.nav.signup}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
