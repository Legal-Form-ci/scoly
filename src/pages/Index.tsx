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

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
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
