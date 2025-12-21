import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User, ShoppingCart, LogOut, Shield, Bell, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const { user, signOut, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const navItems = [
    { label: "Boutique", href: "/shop" },
    { label: "Journal", href: "/journal" },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.contact, href: "/contact" },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo with slogan */}
          <Link to="/" className="flex items-center gap-2">
            <Logo showSlogan />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link 
                key={item.label} 
                to={item.href} 
                className="flex items-center gap-1 px-4 py-2 text-foreground/80 hover:text-primary font-medium transition-colors rounded-lg hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <LanguageSwitcher />
            
            <div className="w-px h-6 bg-border mx-2" />
            
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="icon" title="Administration">
                      <Shield size={18} />
                    </Button>
                  </Link>
                )}
                <Link to="/account">
                  <Button variant="outline"><User size={18} />{t.nav.myAccount}</Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut size={18} /></Button>
              </>
            ) : (
              <>
                <Link to="/auth"><Button variant="outline"><User size={18} />{t.nav.login}</Button></Link>
                <Link to="/auth"><Button variant="hero">{t.nav.signup}</Button></Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden p-2 text-foreground" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-fade-in">
            <div className="px-4 pb-4 border-b border-border mb-4">
              <LanguageSwitcher />
            </div>
            
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link 
                  key={item.label} 
                  to={item.href} 
                  className="block px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors" 
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-4 px-4">
                {user ? (
                  <>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full"><Shield size={18} />Administration</Button>
                      </Link>
                    )}
                    <Link to="/account" onClick={() => setIsOpen(false)}><Button variant="outline" className="w-full"><User size={18} />{t.nav.myAccount}</Button></Link>
                    <Button variant="ghost" className="w-full" onClick={handleLogout}><LogOut size={18} />{t.nav.logout}</Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setIsOpen(false)}><Button variant="outline" className="w-full"><User size={18} />{t.nav.login}</Button></Link>
                    <Link to="/auth" onClick={() => setIsOpen(false)}><Button variant="hero" className="w-full">{t.nav.signup}</Button></Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
