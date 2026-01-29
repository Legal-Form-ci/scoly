import React, { useEffect, useState } from "react";
import { ArrowRight, ShoppingBag, Newspaper, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import HeroAdvertisements from "./HeroAdvertisements";

const HeroSection = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ products: 0, articles: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      const { count: articlesCount } = await supabase
        .from("articles")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");

      setStats({
        products: productsCount || 0,
        articles: articlesCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const formatNumber = (num: number) => {
    if (num === 0) return "0";
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1).replace(".0", "")}K+`;
    }
    return num.toString() + (num > 0 ? "+" : "");
  };

  const scolyCategories = [
    { name: "Izy-Scoly Primaire", slug: "scoly-primaire" },
    { name: "Izy-Scoly Secondaire", slug: "scoly-secondaire" },
    { name: "Izy-Scoly Université", slug: "scoly-universite" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background - Solid color */}
      <div className="absolute inset-0 bg-primary" />

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float animation-delay-200" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-foreground/5 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* CENTERED MAIN HEADING - spans both columns */}
          <div className="text-center mb-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-primary-foreground/90 text-sm font-medium">
                Fournitures scolaires et bureautiques 📚
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-primary-foreground mb-4 leading-tight">
              {t.hero.title1}
              <span className="block mt-2 text-accent">{t.hero.title2}</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-primary-foreground/90 max-w-3xl mx-auto mb-8 leading-relaxed">
              Votre référence en Côte d'Ivoire pour les fournitures scolaires et bureautiques de qualité,
              livrées gratuitement partout.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link to="/shop">
                <Button variant="accent" size="xl">
                  <ShoppingBag size={20} />
                  Découvrir nos produits
                </Button>
              </Link>
              <Link to="/actualites">
                <Button variant="heroOutline" size="xl">
                  <Newspaper size={20} />
                  Actualités
                </Button>
              </Link>
            </div>
          </div>

          {/* TWO COLUMN LAYOUT: "À la une" on right, 3 blocks below it */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
            {/* LEFT COLUMN: Categories pills + Feature cards */}
            <div className="animate-slide-up animation-delay-300">
              {/* Categories - Quick access */}
              <div className="mb-6">
                <p className="text-primary-foreground/70 text-sm mb-3">Parcourir par catégorie :</p>
                <div className="flex flex-wrap gap-2">
                  {scolyCategories.map((category) => (
                    <Link
                      key={category.slug}
                      to={`/shop?category=${category.slug}`}
                      className="px-4 py-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground text-sm font-medium transition-all hover:scale-[1.03]"
                    >
                      {category.name}
                    </Link>
                  ))}
                  <Link
                    to="/shop?category=scoly-bureautique"
                    className="px-4 py-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground text-sm font-medium transition-all hover:scale-[1.03]"
                  >
                    Izy-Scoly Bureautique
                  </Link>
                  <Link
                    to="/shop?category=scoly-librairie"
                    className="px-4 py-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground text-sm font-medium transition-all hover:scale-[1.03]"
                  >
                    Izy-Scoly Librairie
                  </Link>
                </div>
              </div>

              {/* 3 Feature Cards - NOW BELOW "À la une" area */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FeatureCard
                  icon={<ShoppingBag size={24} />}
                  title="Catalogue"
                  description={`${formatNumber(stats.products)} produits`}
                  color="bg-primary-foreground/10"
                  href="/shop"
                />
                <FeatureCard
                  icon={<Truck size={24} />}
                  title="Livraison gratuite"
                  description="Sur toutes vos commandes"
                  color="bg-secondary/20"
                  href="/shop"
                />
                <FeatureCard
                  icon={<Newspaper size={24} />}
                  title="Actualités"
                  description={`${formatNumber(stats.articles)} publications`}
                  color="bg-accent/20"
                  href="/actualites"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: "À la une" carousel (ads + articles) */}
            <div className="animate-slide-up animation-delay-100 lg:sticky lg:top-24">
              <HeroAdvertisements />
            </div>
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
      className={`group relative p-4 rounded-xl ${color} backdrop-blur-sm border border-primary-foreground/10 hover:border-primary-foreground/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
    >
      <div className="flex flex-col items-center text-center gap-2">
        <div className="p-2 rounded-lg bg-primary-foreground/10 text-primary-foreground group-hover:bg-primary-foreground/20 transition-colors">
          {icon}
        </div>
        <h3 className="text-base font-display font-semibold text-primary-foreground">{title}</h3>
        <p className="text-xs text-primary-foreground/80">{description}</p>
      </div>
      <ArrowRight
        size={16}
        className="absolute top-3 right-3 text-primary-foreground/50 group-hover:text-primary-foreground group-hover:translate-x-1 transition-all"
      />
    </Link>
  );
};

export default HeroSection;
