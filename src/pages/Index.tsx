import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedProductsCarousel from "@/components/FeaturedProductsCarousel";
import FeaturedArticlesCarousel from "@/components/FeaturedArticlesCarousel";
import SpacesSection from "@/components/SpacesSection";
import FeaturesSection from "@/components/FeaturesSection";
import PaymentSection from "@/components/PaymentSection";
import StatsSection from "@/components/StatsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import FreeShippingPopup from "@/components/FreeShippingPopup";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <SEOHead 
        title="Izy-scoly - Fournitures scolaires et bureautiques en Côte d'Ivoire"
        description="Votre référence pour les fournitures scolaires et bureautiques de qualité. Livraison gratuite partout en Côte d'Ivoire. Primaire, Secondaire, Université, Bureautique."
        url="https://izy-scoly.ci"
        keywords={["fournitures scolaires", "bureautique", "Côte d'Ivoire", "Abidjan", "livraison gratuite", "école", "université", "livres scolaires"]}
      />
      <Navbar />
      <HeroSection />
      <FeaturedProductsCarousel />
      <SpacesSection />
      <FeaturedArticlesCarousel />
      <FeaturesSection />
      <StatsSection />
      <PaymentSection />
      <CTASection />
      <Footer />
      <FreeShippingPopup />
    </main>
  );
};

export default Index;
