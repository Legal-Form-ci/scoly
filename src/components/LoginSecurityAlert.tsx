import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Monitor, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LoginSecurityAlertProps {
  notification: {
    id: string;
    data: {
      session_id: string;
      ip_address: string | null;
      device_info: string | null;
      requires_confirmation: boolean;
    } | null;
  };
  onClose: () => void;
}

const LoginSecurityAlert = ({ notification, onClose }: LoginSecurityAlertProps) => {
  const [loading, setLoading] = useState(false);
  const data = notification.data;

  if (!data?.requires_confirmation) return null;

  const handleConfirm = async (isMe: boolean) => {
    setLoading(true);
    try {
      // Update login session
      const { error: sessionError } = await supabase
        .from('login_sessions')
        .update({
          is_confirmed: isMe,
          is_blocked: !isMe,
          confirmed_at: new Date().toISOString()
        })
        .eq('id', data.session_id);

      if (sessionError) throw sessionError;

      // Mark notification as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);

      if (isMe) {
        toast.success('Connexion confirmée avec succès');
      } else {
        toast.warning('Connexion bloquée ! Si ce n\'était pas vous, changez votre mot de passe immédiatement.');
      }

      onClose();
    } catch (error) {
      console.error('Error confirming login:', error);
      toast.error('Erreur lors de la confirmation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Nouvelle connexion détectée
          </DialogTitle>
          <DialogDescription>
            Une nouvelle connexion a été détectée sur votre compte. Est-ce vous ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">
                {data.device_info || 'Appareil inconnu'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">
                IP: {data.ip_address || 'Inconnue'}
              </span>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Si vous ne reconnaissez pas cette connexion, cliquez sur "Ce n'est pas moi" pour bloquer cette session et sécuriser votre compte.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="destructive"
            onClick={() => handleConfirm(false)}
            disabled={loading}
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Ce n'est pas moi
          </Button>
          <Button
            onClick={() => handleConfirm(true)}
            disabled={loading}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Oui, c'est moi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoginSecurityAlert;
