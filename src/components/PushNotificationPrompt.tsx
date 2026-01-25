import { useState, useEffect, useCallback } from 'react';
import { Bell, ShieldAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const PushNotificationPrompt = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
  } = usePushNotifications();

  const [showPrompt, setShowPrompt] = useState(false);
  const [showBlockedWarning, setShowBlockedWarning] = useState(false);
  const [dismissCount, setDismissCount] = useState(0);

  // Persistent prompt - shows repeatedly until user accepts
  useEffect(() => {
    if (!user || !isSupported) return;

    // Already subscribed - hide prompt
    if (isSubscribed) {
      setShowPrompt(false);
      return;
    }

    // Permission blocked by browser
    if (permission === 'denied') {
      setShowBlockedWarning(true);
      return;
    }

    // Get dismiss count from localStorage
    const storedDismissCount = parseInt(localStorage.getItem('push_prompt_dismiss_count') || '0');
    setDismissCount(storedDismissCount);

    // Calculate delay based on dismiss count (more dismisses = shorter delay to be more insistent)
    const baseDelay = 3000;
    const maxDismisses = 5;
    const delay = storedDismissCount < maxDismisses 
      ? baseDelay + (storedDismissCount * 2000)
      : baseDelay;

    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [user, isSupported, isSubscribed, permission]);

  // Re-prompt on route changes if not subscribed
  useEffect(() => {
    if (!user || !isSupported || isSubscribed || permission === 'denied') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isSubscribed) {
        const storedDismissCount = parseInt(localStorage.getItem('push_prompt_dismiss_count') || '0');
        if (storedDismissCount < 10) {
          setTimeout(() => setShowPrompt(true), 5000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, isSupported, isSubscribed, permission]);

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      toast({
        title: '🔔 Notifications activées',
        description: 'Vous recevrez des alertes de sécurité même hors du site.',
      });
      setShowPrompt(false);
      localStorage.setItem('push_prompt_dismiss_count', '0');
    } else {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'activer les notifications. Vérifiez vos paramètres navigateur.',
        variant: 'destructive',
      });
    }
  };

  const handleDismiss = useCallback(() => {
    const newCount = dismissCount + 1;
    setDismissCount(newCount);
    localStorage.setItem('push_prompt_dismiss_count', String(newCount));
    setShowPrompt(false);
    
    // Show warning toast after 3 dismisses
    if (newCount >= 3) {
      toast({
        title: '⚠️ Sécurité réduite',
        description: 'Sans notifications, vous ne serez pas alerté des connexions suspectes.',
        variant: 'destructive',
      });
    }
  }, [dismissCount, toast]);

  // Show blocked warning
  if (showBlockedWarning && user) {
    return (
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
        <div className="bg-destructive/10 border border-destructive rounded-xl shadow-lg p-4">
          <button
            onClick={() => setShowBlockedWarning(false)}
            className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-destructive/20 rounded-full">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-destructive mb-1">
                Notifications bloquées
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Les notifications sont bloquées par votre navigateur. Pour recevoir les alertes de sécurité, 
                allez dans les paramètres de votre navigateur et autorisez les notifications pour ce site.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBlockedWarning(false)}
              >
                J'ai compris
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't show anything if not supported or already subscribed
  if (!isSupported || !user || isSubscribed || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-card border-2 border-primary rounded-xl shadow-lg p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-full animate-pulse">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-1">
              🔐 Protection de votre compte
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              {dismissCount < 3 
                ? "Activez les notifications pour être alerté immédiatement si quelqu'un tente de se connecter à votre compte."
                : "IMPORTANT : Sans notifications, vous ne saurez pas si un pirate tente d'accéder à votre compte !"}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSubscribe}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Activation...' : '✓ Activer maintenant'}
              </Button>
              {dismissCount < 5 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-muted-foreground"
                >
                  Plus tard
                </Button>
              )}
            </div>
            {dismissCount >= 3 && (
              <p className="text-xs text-destructive mt-2">
                Vous avez ignoré cette demande {dismissCount} fois. Votre sécurité est en jeu.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationPrompt;
