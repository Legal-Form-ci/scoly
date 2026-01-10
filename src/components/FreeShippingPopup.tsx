import { useState, useEffect } from "react";
import { X, Truck, Gift, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const FREE_SHIPPING_THRESHOLD = 15500;

export const FreeShippingPopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has dismissed this popup recently (24h)
    const dismissed = localStorage.getItem("freeShippingPopupDismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const now = Date.now();
      const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        return;
      }
    }

    // Show popup after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("freeShippingPopupDismissed", Date.now().toString());
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-lg"
          >
            <div className="relative bg-card rounded-2xl shadow-2xl border-2 border-primary/20 overflow-hidden">
              {/* Decorative top bar */}
              <div className="h-2 bg-primary" />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors z-10"
                aria-label="Fermer"
              >
                <X size={20} className="text-muted-foreground" />
              </button>

              {/* Content */}
              <div className="p-6 sm:p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                      <Truck size={40} className="text-primary" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-accent rounded-full flex items-center justify-center animate-bounce">
                      <Gift size={16} className="text-accent-foreground" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
                    🚨 Livraison gratuite !
                  </h2>
                  <p className="text-lg text-primary font-semibold">
                    Partout en Côte d'Ivoire
                  </p>
                </div>

                {/* Details */}
                <div className="bg-muted/50 rounded-xl p-4 mb-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-sm">1</span>
                    </div>
                    <p className="text-foreground">
                      À partir de <span className="font-bold text-primary">{FREE_SHIPPING_THRESHOLD.toLocaleString("fr-FR")} FCFA</span> d'achat
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-sm">2</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <Smartphone size={18} className="text-accent" />
                      <span>Paiement par Mobile Money (Orange Money, MTN Money, Wave)</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-sm">3</span>
                    </div>
                    <p className="text-foreground">
                      Livraison en point relais (agence Izy-scoly)
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/shop" className="flex-1" onClick={handleClose}>
                    <Button variant="hero" className="w-full h-12 text-base">
                      Profitez maintenant
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="h-12"
                    onClick={handleClose}
                  >
                    Plus tard
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FreeShippingPopup;
