import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { useLanguage } from "@/i18n/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
  
  const links = {
    platform: [
      { label: "Scoly Primaire", href: "/shop?category=primaire" },
      { label: "Scoly Secondaire", href: "/shop?category=secondaire" },
      { label: "Scoly Université", href: "/shop?category=universite" },
      { label: "Scoly Bureautique", href: "/shop?category=bureautique" },
      { label: "Scoly Librairie", href: "/shop?category=librairie" },
    ],
    resources: [
      { label: "Journal Scoly", href: "/journal" },
      { label: "Vendeurs", href: "/vendor" },
      { label: t.footer.faq, href: "/faq" },
    ],
    legal: [
      { label: t.footer.terms, href: "/terms" },
      { label: t.footer.privacy, href: "/privacy" },
      { label: t.footer.cookies, href: "/cookies" },
    ],
  };

  const socials = [
    { icon: <Facebook size={20} />, href: "#", label: "Facebook" },
    { icon: <Twitter size={20} />, href: "#", label: "Twitter" },
    { icon: <Instagram size={20} />, href: "#", label: "Instagram" },
    { icon: <Linkedin size={20} />, href: "#", label: "LinkedIn" },
  ];

  return (
    <footer className="bg-foreground text-primary-foreground pt-16 pb-8" id="contact">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Logo variant="white" size="lg" />
            <p className="mt-4 text-primary-foreground/70 max-w-sm">
              {t.footer.description}
            </p>

            {/* Contact Info */}
            <div className="mt-6 space-y-3">
              <a href="mailto:contact@scoly.ci" className="flex items-center gap-3 text-primary-foreground/70 hover:text-accent transition-colors">
                <Mail size={18} />
                {t.footer.email}
              </a>
              <a href="tel:+22507000000" className="flex items-center gap-3 text-primary-foreground/70 hover:text-accent transition-colors">
                <Phone size={18} />
                {t.footer.phone}
              </a>
              <div className="flex items-center gap-3 text-primary-foreground/70">
                <MapPin size={18} />
                {t.footer.address}
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Scoly Marketplace</h4>
            <ul className="space-y-3">
              {links.platform.map((link, index) => (
                <li key={index}>
                  <Link to={link.href} className="text-primary-foreground/70 hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-lg mb-4">{t.footer.resources}</h4>
            <ul className="space-y-3">
              {links.resources.map((link, index) => (
                <li key={index}>
                  <Link to={link.href} className="text-primary-foreground/70 hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-lg mb-4">{t.footer.legal}</h4>
            <ul className="space-y-3">
              {links.legal.map((link, index) => (
                <li key={index}>
                  <Link to={link.href} className="text-primary-foreground/70 hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-primary-foreground/60 text-sm">
              © {new Date().getFullYear()} Scoly. {t.footer.copyright}
            </p>
            <a 
              href="https://wa.me/2250759566087?text=Bonjour%2C%20je%20vous%20contacte%20depuis%20la%20plateforme%20Scoly.%20J'aimerais%20avoir%20plus%20d'informations."
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-foreground/40 text-xs mt-1 hover:text-accent transition-colors inline-block"
            >
              Plateforme développée par Innocent KOFFI
            </a>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socials.map((social, index) => (
              <a
                key={index}
                href={social.href}
                aria-label={social.label}
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground/70 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
