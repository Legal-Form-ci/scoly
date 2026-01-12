import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  media_type: string;
  media_url: string | null;
  link_url: string | null;
  link_text: string | null;
}

const HeroAdvertisements = () => {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  useEffect(() => {
    if (advertisements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % advertisements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [advertisements.length]);

  const fetchAdvertisements = async () => {
    try {
      const { data, error } = await supabase
        .from("advertisements")
        .select("id, title, description, media_type, media_url, link_url, link_text")
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .limit(5);

      if (error) throw error;
      setAdvertisements(data || []);
    } catch (error) {
      console.error("Error fetching ads:", error);
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? advertisements.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % advertisements.length);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 backdrop-blur-sm overflow-hidden animate-pulse">
        <div className="h-64 bg-primary-foreground/5" />
      </div>
    );
  }

  // Fallback content if no ads
  if (advertisements.length === 0) {
    return (
      <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 backdrop-blur-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-primary-foreground">
                À la une
              </h2>
              <p className="text-primary-foreground/80 text-sm mt-1">
                Promotions, partenaires, offres exclusives et nouveautés
              </p>
            </div>
            <span className="inline-flex items-center rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs text-primary-foreground/80">
              Publicité
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-primary-foreground/15 bg-background/10 p-4">
              <p className="text-primary-foreground font-semibold">Pack rentrée</p>
              <p className="text-primary-foreground/80 text-sm mt-1">
                Des offres conçues pour les élèves et étudiants.
              </p>
            </div>
            <div className="rounded-xl border border-primary-foreground/15 bg-background/10 p-4">
              <p className="text-primary-foreground font-semibold">Partenaires</p>
              <p className="text-primary-foreground/80 text-sm mt-1">
                Mettez votre marque en avant sur Izy-Scoly.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Link to="/contact">
              <Button variant="heroOutline" className="w-full">
                Devenir partenaire
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentAd = advertisements[currentIndex];

  return (
    <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 backdrop-blur-sm overflow-hidden">
      <div className="relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white">
              À la une
            </span>
            {advertisements.length > 1 && (
              <span className="text-white/80 text-xs">
                {currentIndex + 1} / {advertisements.length}
              </span>
            )}
          </div>
        </div>

        {/* Media */}
        <div className="relative aspect-[4/3] sm:aspect-video">
          {currentAd.media_type === "image" && currentAd.media_url ? (
            <img
              src={currentAd.media_url}
              alt={currentAd.title}
              className="w-full h-full object-cover"
            />
          ) : currentAd.media_type === "video" && currentAd.media_url ? (
            <video
              src={currentAd.media_url}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center p-6">
              <p className="text-2xl font-display font-bold text-white text-center">
                {currentAd.title}
              </p>
            </div>
          )}

          {/* Overlay with content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-display font-bold text-white mb-1">
              {currentAd.title}
            </h3>
            {currentAd.description && (
              <p className="text-white/80 text-sm line-clamp-2 mb-3">
                {currentAd.description}
              </p>
            )}
            {currentAd.link_url && (
              <Link
                to={currentAd.link_url}
                className="inline-flex items-center gap-2 text-white font-medium text-sm hover:underline"
              >
                {currentAd.link_text || "En savoir plus"}
                <ExternalLink size={14} />
              </Link>
            )}
          </div>

          {/* Navigation Arrows */}
          {advertisements.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white h-8 w-8 rounded-full"
                onClick={goToPrevious}
              >
                <ChevronLeft size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white h-8 w-8 rounded-full"
                onClick={goToNext}
              >
                <ChevronRight size={18} />
              </Button>
            </>
          )}
        </div>

        {/* Dots */}
        {advertisements.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {advertisements.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-white w-4"
                    : "bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroAdvertisements;
