import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Share2, Twitter } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { useLanguage } from "@/i18n/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  const links = {
    categories: [
      { label: "Izy-Scoly Primaire", href: "/shop?category=scoly-primaire" },
      { label: "Izy-Scoly Secondaire", href: "/shop?category=scoly-secondaire" },
      { label: "Izy-Scoly Université", href: "/shop?category=scoly-universite" },
      { label: "Izy-Scoly Bureautique", href: "/shop?category=scoly-bureautique" },
      { label: "Izy-Scoly Librairie", href: "/shop?category=scoly-librairie" },
    ],
    resources: [
      { label: "Actualités", href: "/actualites" },
      { label: t.footer.faq, href: "/faq" },
      { label: t.nav.about, href: "/about" },
      { label: t.nav.contact, href: "/contact" },
    ],
    legal: [
      { label: t.footer.terms, href: "/terms" },
      { label: t.footer.privacy, href: "/privacy" },
      { label: t.footer.cookies, href: "/cookies" },
    ],
  };

  const socials = [
    { icon: <Facebook size={20} />, href: "https://facebook.com/izyscoly", label: "Facebook" },
    { icon: <Twitter size={20} />, href: "https://twitter.com/izyscoly", label: "Twitter" },
    { icon: <Instagram size={20} />, href: "https://instagram.com/izyscoly", label: "Instagram" },
    { icon: <Linkedin size={20} />, href: "https://linkedin.com/company/izyscoly", label: "LinkedIn" },
  ];

  return (
    <footer className="bg-foreground text-primary-foreground pt-16 pb-8" id="contact">
      <div className="container mx-auto px-4">
        {/* Social Share Bar - Visible and prominent */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 pb-8 border-b border-primary-foreground/20">
          <div className="flex items-center gap-2 text-primary-foreground/80">
            <Share2 size={20} />
            <span className="font-medium">Suivez-nous sur les réseaux :</span>
          </div>
          <div className="flex items-center gap-3">
            {socials.map((social, index) => (
              <a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300 hover:scale-110"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Logo variant="white" size="lg" />
            <p className="mt-4 text-primary-foreground/80 max-w-sm leading-relaxed">
              La plateforme de référence en Côte d'Ivoire pour les fournitures scolaires et bureautiques de qualité.
            </p>

            {/* Contact Info */}
            <div className="mt-6 space-y-3">
              <a
                href="mailto:contact@izy-scoly.ci"
                className="flex items-center gap-3 text-primary-foreground/80 hover:text-accent transition-colors"
              >
                <Mail size={18} />
                contact@izy-scoly.ci
              </a>
              <a
                href="tel:+2250759566087"
                className="flex items-center gap-3 text-primary-foreground/80 hover:text-accent transition-colors"
              >
                <Phone size={18} />
                +225 07 59 56 60 87
              </a>
              <div className="flex items-center gap-3 text-primary-foreground/80">
                <MapPin size={18} />
                Abidjan, Côte d'Ivoire
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4 text-primary-foreground">Nos catégories</h4>
            <ul className="space-y-3">
              {links.categories.map((link, index) => (
                <li key={index}>
                  <Link to={link.href} className="text-primary-foreground/70 hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-lg mb-4 text-primary-foreground">{t.footer.resources}</h4>
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
            <h4 className="font-display font-semibold text-lg mb-4 text-primary-foreground">{t.footer.legal}</h4>
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
        <div className="pt-8 border-t border-primary-foreground/20">
          <div className="text-center space-y-2">
            <p className="text-primary-foreground/80 text-sm">
              © {new Date().getFullYear()} Izy-Scoly. Tous droits réservés.
            </p>
            <a
              href="https://ikoffi.agricapital.ci"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 text-primary-foreground/60 text-xs hover:text-accent transition-colors"
            >
              <img
                src="/founder-inocent-koffi.jpg"
                alt="Inocent KOFFI"
                className="w-6 h-6 rounded-full object-cover border border-primary-foreground/30"
                loading="lazy"
              />
              <span>Plateforme développée par Inocent KOFFI</span>
            </a>
          </div>

          {/* Copyright mobile social links */}
          <div className="flex items-center justify-center gap-4 mt-6 md:hidden">
            {socials.map((social, index) => (
              <a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
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
