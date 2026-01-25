import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useLoginSecurity = () => {
  const { user } = useAuth();

  // Get device info
  const getDeviceInfo = useCallback(() => {
    const ua = navigator.userAgent;
    let device = 'Navigateur inconnu';
    
    if (ua.includes('Chrome')) device = 'Chrome';
    else if (ua.includes('Firefox')) device = 'Firefox';
    else if (ua.includes('Safari')) device = 'Safari';
    else if (ua.includes('Edge')) device = 'Edge';
    
    const platform = navigator.platform || 'Appareil inconnu';
    return `${device} sur ${platform}`;
  }, []);

  // Send push notification for login attempt
  const sendLoginPushNotification = useCallback(async (userId: string, deviceInfo: string, ipAddress: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: userId,
          title: 'Nouvelle connexion détectée',
          body: `Une connexion a été détectée depuis ${deviceInfo}. Est-ce vous ?`,
          data: {
            type: 'security',
            requires_confirmation: true,
            device_info: deviceInfo,
            ip_address: ipAddress
          }
        }
      });

      if (error) {
        console.error('[Push] Error sending login notification:', error);
      } else {
        console.log('[Push] Login notification sent:', data);
      }
    } catch (error) {
      console.error('[Push] Failed to send login notification:', error);
    }
  }, []);

  // Record login session
  const recordLoginSession = useCallback(async (userId: string) => {
    try {
      const deviceInfo = getDeviceInfo();
      
      // Get IP from a service (in production, this would be from the server)
      let ipAddress = 'Non disponible';
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ipAddress = data.ip;
      } catch {
        console.log('Could not fetch IP');
      }

      const { error } = await supabase
        .from('login_sessions')
        .insert({
          user_id: userId,
          device_info: deviceInfo,
          ip_address: ipAddress
        });

      if (error) {
        console.error('Error recording login session:', error);
      } else {
        // Send push notification after recording session
        await sendLoginPushNotification(userId, deviceInfo, ipAddress);
      }
    } catch (error) {
      console.error('Error in recordLoginSession:', error);
    }
  }, [getDeviceInfo, sendLoginPushNotification]);

  // Check for blocked sessions
  const checkBlockedSessions = useCallback(async () => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('login_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_blocked', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking blocked sessions:', error);
      return false;
    }
  }, [user]);

  // Get pending confirmation sessions
  const getPendingConfirmations = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'security')
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.filter(n => {
        const notifData = n.data as Record<string, unknown> | null;
        return notifData?.requires_confirmation === true;
      }) || [];
    } catch (error) {
      console.error('Error getting pending confirmations:', error);
      return [];
    }
  }, [user]);

  return {
    recordLoginSession,
    checkBlockedSessions,
    getPendingConfirmations,
    getDeviceInfo,
    sendLoginPushNotification
  };
};
