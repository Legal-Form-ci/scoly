import { ArrowRight, ShoppingBag, Newspaper, Store, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const HeroSection = () => {
  const { t } = useLanguage();
  
  // Scoly cycles for marketplace
  const scolyCycles = [
    { name: "Scoly Primaire", slug: "primaire", color: "bg-green-500/20" },
    { name: "Scoly Secondaire", slug: "secondaire", color: "bg-blue-500/20" },
    { name: "Scoly Université", slug: "universite", color: "bg-purple-500/20" },
    { name: "Scoly Bureautique", slug: "bureautique", color: "bg-orange-500/20" },
    { name: "Scoly Librairie", slug: "librairie", color: "bg-red-500/20" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero opacity-95" />
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float animation-delay-200" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-light/10 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 mb-8 animate-slide-up">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-primary-foreground/90 text-sm font-medium">
              {t.hero.badge}
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold text-primary-foreground mb-6 animate-slide-up animation-delay-100 leading-tight">
            {t.hero.title1}
            <span className="block mt-2 text-accent">{t.hero.title2}</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10 animate-slide-up animation-delay-200">
            {t.hero.subtitle}
          </p>

          {/* CTA Buttons - 3 buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up animation-delay-300">
            <Link to="/shop">
              <Button variant="accent" size="xl" className="w-full sm:w-auto">
                <ShoppingBag size={20} />
                Acheter vos fournitures
              </Button>
            </Link>
            <Link to="/journal">
              <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
                <Newspaper size={20} />
                Découvrir le Journal
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
                <Store size={20} />
                Devenir vendeur
              </Button>
            </Link>
          </div>

          {/* Scoly Cycles - Quick access */}
          <div className="mb-12 animate-slide-up animation-delay-400">
            <p className="text-primary-foreground/60 text-sm mb-4">Parcourir par cycle :</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {scolyCycles.map((cycle) => (
                <Link
                  key={cycle.slug}
                  to={`/shop?category=${cycle.slug}`}
                  className={`px-4 py-2 rounded-full ${cycle.color} backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground text-sm font-medium hover:bg-primary-foreground/20 hover:scale-105 transition-all`}
                >
                  {cycle.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Feature Cards - Scoly structure */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up animation-delay-500">
            <FeatureCard
              icon={<ShoppingBag size={28} />}
              title="Scoly Marketplace"
              description="Fournitures scolaires & bureautiques"
              color="bg-primary-light/20"
              href="/shop"
            />
            <FeatureCard
              icon={<Newspaper size={28} />}
              title="Journal Scoly"
              description="Articles & contenus éducatifs"
              color="bg-secondary/20"
              href="/journal"
            />
            <FeatureCard
              icon={<Store size={28} />}
              title="Espace Vendeur"
              description="Vendez vos produits en ligne"
              color="bg-accent/20"
              href="/vendor"
            />
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path 
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  href: string;
}

const FeatureCard = ({ icon, title, description, color, href }: FeatureCardProps) => {
  return (
    <Link
      to={href}
      className={`group relative p-6 rounded-2xl ${color} backdrop-blur-sm border border-primary-foreground/10 hover:border-primary-foreground/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
    >
      <div className="flex flex-col items-center text-center gap-3">
        <div className="p-3 rounded-xl bg-primary-foreground/10 text-primary-foreground group-hover:bg-primary-foreground/20 transition-colors">
          {icon}
        </div>
        <h3 className="text-lg font-display font-semibold text-primary-foreground">{title}</h3>
        <p className="text-sm text-primary-foreground/70">{description}</p>
      </div>
      <ArrowRight 
        size={18} 
        className="absolute top-4 right-4 text-primary-foreground/50 group-hover:text-primary-foreground group-hover:translate-x-1 transition-all" 
      />
    </Link>
  );
};

export default HeroSection;
