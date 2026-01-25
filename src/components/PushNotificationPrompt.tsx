import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
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
    unsubscribe
  } = usePushNotifications();

  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show prompt after user logs in if not subscribed
  useEffect(() => {
    if (user && isSupported && !isSubscribed && permission === 'default' && !dismissed) {
      // Wait a bit before showing to not be intrusive
      const timer = setTimeout(() => {
        const hasSeenPrompt = localStorage.getItem('push_prompt_dismissed');
        if (!hasSeenPrompt) {
          setShowPrompt(true);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user, isSupported, isSubscribed, permission, dismissed]);

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      toast({
        title: 'Notifications activées',
        description: 'Vous recevrez des alertes même hors du site',
      });
      setShowPrompt(false);
    } else {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'activer les notifications',
        variant: 'destructive',
      });
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('push_prompt_dismissed', 'true');
  };

  // Don't show anything if not supported or already subscribed
  if (!isSupported || !user || isSubscribed || permission === 'denied' || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-1">
              Activer les notifications ?
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Recevez des alertes de sécurité et le suivi de vos commandes, même quand vous n'êtes pas sur le site.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSubscribe}
                disabled={loading}
              >
                {loading ? 'Activation...' : 'Activer'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
              >
                Plus tard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationPrompt;
