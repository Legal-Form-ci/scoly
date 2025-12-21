import { ShoppingBag, Newspaper, Store, ArrowRight, Package, Truck, CreditCard, Star, PenTool, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const SpacesSection = () => {
  const { t } = useLanguage();
  
  return (
    <section className="py-20 lg:py-32 bg-background" id="spaces">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Nos services
          </span>
          <h2 className="text-3xl lg:text-5xl font-display font-bold text-foreground mb-4">
            Trois espaces, une seule plateforme
          </h2>
          <p className="text-lg text-muted-foreground">
            Découvrez notre marketplace, notre journal scolaire et notre espace vendeur
          </p>
        </div>

        {/* Spaces Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Marketplace */}
          <SpaceCard
            id="marketplace"
            icon={<ShoppingBag size={32} />}
            title="Marketplace"
            subtitle="Achetez vos fournitures"
            description="Trouvez toutes vos fournitures scolaires et bureautiques auprès de vendeurs vérifiés en Côte d'Ivoire."
            features={[
              { icon: <Package size={18} />, text: "Milliers de produits" },
              { icon: <Truck size={18} />, text: "Livraison rapide" },
              { icon: <CreditCard size={18} />, text: "Paiement Mobile Money" },
            ]}
            stats={{ value: "1,200+", label: "Produits" }}
            gradient="from-primary to-primary-light"
            buttonVariant="hero"
            href="/shop"
          />

          {/* Journal Scoly */}
          <SpaceCard
            id="journal"
            icon={<Newspaper size={32} />}
            title="Journal Scoly"
            subtitle="Articles & Publications"
            description="Lisez et publiez des articles éducatifs, ouvrages et ressources pour les élèves et étudiants."
            features={[
              { icon: <PenTool size={18} />, text: "Publiez vos articles" },
              { icon: <BookOpen size={18} />, text: "Contenus éducatifs" },
              { icon: <Star size={18} />, text: "Auteurs vérifiés" },
            ]}
            stats={{ value: "500+", label: "Articles" }}
            gradient="from-secondary to-secondary-light"
            buttonVariant="coral"
            href="/journal"
          />

          {/* Espace Vendeur */}
          <SpaceCard
            id="vendeur"
            icon={<Store size={32} />}
            title="Espace Vendeur"
            subtitle="Vendez vos produits"
            description="Créez votre boutique en ligne et vendez vos fournitures scolaires et bureautiques sur Scoly."
            features={[
              { icon: <Package size={18} />, text: "Gestion de catalogue" },
              { icon: <CreditCard size={18} />, text: "Paiements sécurisés" },
              { icon: <Star size={18} />, text: "Commissions réduites" },
            ]}
            stats={{ value: "100+", label: "Vendeurs" }}
            gradient="from-accent to-yellow-400"
            buttonVariant="accent"
            href="/vendor"
          />
        </div>
      </div>
    </section>
  );
};

interface SpaceCardProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  features: { icon: React.ReactNode; text: string }[];
  stats: { value: string; label: string };
  gradient: string;
  buttonVariant: "hero" | "coral" | "accent";
  href: string;
}

const SpaceCard = ({ id, icon, title, subtitle, description, features, stats, gradient, buttonVariant, href }: SpaceCardProps) => {
  const { t } = useLanguage();
  
  return (
    <div 
      id={id}
      className="group relative bg-card rounded-3xl border border-border overflow-hidden hover:shadow-lg transition-all duration-500 hover:-translate-y-2"
    >
      {/* Gradient Header */}
      <div className={`h-40 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -top-8 -left-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        
        <div className="relative h-full flex flex-col items-center justify-center">
          <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm text-white mb-2">
            {icon}
          </div>
          <span className="text-white/80 text-sm">{subtitle}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-display font-bold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6">{description}</p>

        {/* Features */}
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3 text-sm text-foreground/80">
              <span className="text-primary">{feature.icon}</span>
              {feature.text}
            </li>
          ))}
        </ul>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <div className="text-2xl font-display font-bold text-foreground">{stats.value}</div>
            <div className="text-sm text-muted-foreground">{stats.label}</div>
          </div>
          <Link to={href}>
            <Button variant={buttonVariant}>
              {t.common.learnMore}
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};

export default SpacesSection;
