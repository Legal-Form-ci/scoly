import { 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  HeadphonesIcon, 
  Store,
  Users,
  BarChart,
  BookOpen
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const FeaturesSection = () => {
  const { t, language } = useLanguage();
  
  const texts = {
    fr: {
      badge: "Fonctionnalités",
      dashboard: "Tableau de bord",
      dashboardDesc: "Suivez vos activités, commandes et statistiques en temps réel.",
      vendors: "Multi-vendeurs",
      vendorsDesc: "Marketplace connectant vendeurs et acheteurs directement.",
      delivery: "Livraison rapide",
      deliveryDesc: "Livraison partout en Côte d'Ivoire avec points de retrait.",
      journal: "Journal Scoly",
      journalDesc: "Publiez et découvrez des articles éducatifs de qualité.",
    },
    en: {
      badge: "Features",
      dashboard: "Dashboard",
      dashboardDesc: "Track your activities, orders and statistics in real time.",
      vendors: "Multi-vendor",
      vendorsDesc: "Marketplace connecting vendors and buyers directly.",
      delivery: "Fast delivery",
      deliveryDesc: "Delivery throughout Ivory Coast with pickup points.",
      journal: "Scoly Journal",
      journalDesc: "Publish and discover quality educational articles.",
    },
    de: {
      badge: "Funktionen",
      dashboard: "Dashboard",
      dashboardDesc: "Verfolgen Sie Ihre Aktivitäten, Bestellungen und Statistiken in Echtzeit.",
      vendors: "Multi-Verkäufer",
      vendorsDesc: "Marktplatz, der Verkäufer und Käufer direkt verbindet.",
      delivery: "Schnelle Lieferung",
      deliveryDesc: "Lieferung in die gesamte Elfenbeinküste mit Abholpunkten.",
      journal: "Scoly Journal",
      journalDesc: "Veröffentlichen und entdecken Sie qualitativ hochwertige Bildungsartikel.",
    },
    es: {
      badge: "Características",
      dashboard: "Panel de control",
      dashboardDesc: "Sigue tus actividades, pedidos y estadísticas en tiempo real.",
      vendors: "Multi-vendedor",
      vendorsDesc: "Marketplace que conecta vendedores y compradores directamente.",
      delivery: "Entrega rápida",
      deliveryDesc: "Entrega en toda Costa de Marfil con puntos de recogida.",
      journal: "Diario Scoly",
      journalDesc: "Publica y descubre artículos educativos de calidad.",
    },
  };

  const currentTexts = texts[language] || texts.fr;
  
  const features = [
    {
      icon: <Store size={24} />,
      title: currentTexts.vendors,
      description: currentTexts.vendorsDesc,
    },
    {
      icon: <CreditCard size={24} />,
      title: t.features.items.payment.title,
      description: t.features.items.payment.description,
    },
    {
      icon: <Truck size={24} />,
      title: currentTexts.delivery,
      description: currentTexts.deliveryDesc,
    },
    {
      icon: <HeadphonesIcon size={24} />,
      title: t.features.items.support.title,
      description: t.features.items.support.description,
    },
    {
      icon: <ShoppingBag size={24} />,
      title: t.features.items.resources.title,
      description: t.features.items.resources.description,
    },
    {
      icon: <Users size={24} />,
      title: t.features.items.updates.title,
      description: t.features.items.updates.description,
    },
    {
      icon: <BarChart size={24} />,
      title: currentTexts.dashboard,
      description: currentTexts.dashboardDesc,
    },
    {
      icon: <BookOpen size={24} />,
      title: currentTexts.journal,
      description: currentTexts.journalDesc,
    },
  ];

  return (
    <section className="py-20 lg:py-32 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/20 text-secondary text-sm font-medium mb-4">
            {currentTexts.badge}
          </span>
          <h2 className="text-3xl lg:text-5xl font-display font-bold text-foreground mb-4">
            {t.features.title}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t.features.subtitle}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 50}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard = ({ icon, title, description, delay }: FeatureCardProps) => {
  return (
    <div 
      className="group p-6 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-display font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

export default FeaturesSection;