import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useLoginSecurity = () => {
  const { user } = useAuth();

  // Get device info - unique fingerprint for this device
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

  // Generate a unique device fingerprint
  const getDeviceFingerprint = useCallback(() => {
    const ua = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const screen = `${window.screen.width}x${window.screen.height}`;
    // Create a simple hash-like string for this device
    const fingerprint = btoa(`${ua}|${platform}|${language}|${screen}`).slice(0, 32);
    return fingerprint;
  }, []);

  // Send push notification to OTHER devices (not the current one)
  const sendLoginPushNotification = useCallback(async (userId: string, deviceInfo: string, ipAddress: string, currentDeviceFingerprint: string) => {
    try {
      // Get all push subscriptions for this user
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (subError) {
        console.error('[Push] Error fetching subscriptions:', subError);
        return;
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log('[Push] No other devices to notify');
        return;
      }

      // Store notification in database for in-app display on OTHER devices
      // The notification will include the current device fingerprint so we can filter it out
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: userId,
        type: 'security',
        title: 'Nouvelle connexion détectée',
        message: `Une connexion a été détectée depuis ${deviceInfo}. Est-ce vous ?`,
        data: {
          type: 'security',
          requires_confirmation: true,
          device_info: deviceInfo,
          ip_address: ipAddress,
          origin_device_fingerprint: currentDeviceFingerprint // The device that triggered this
        },
        is_read: false
      });

      if (notifError) {
        console.error('[Push] Error storing notification:', notifError);
      } else {
        console.log('[Push] Login notification created for other devices');
      }
    } catch (error) {
      console.error('[Push] Failed to send login notification:', error);
    }
  }, []);

  // Record login session
  const recordLoginSession = useCallback(async (userId: string) => {
    try {
      const deviceInfo = getDeviceInfo();
      const deviceFingerprint = getDeviceFingerprint();
      
      // Store fingerprint in localStorage so we can identify this device later
      localStorage.setItem('device_fingerprint', deviceFingerprint);
      
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
        // Send push notification to OTHER devices only
        await sendLoginPushNotification(userId, deviceInfo, ipAddress, deviceFingerprint);
      }
    } catch (error) {
      console.error('Error in recordLoginSession:', error);
    }
  }, [getDeviceInfo, getDeviceFingerprint, sendLoginPushNotification]);

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

    const currentFingerprint = localStorage.getItem('device_fingerprint') || '';

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'security')
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter: only show notifications that are NOT from the current device
      return data?.filter(n => {
        const notifData = n.data as Record<string, unknown> | null;
        if (!notifData?.requires_confirmation) return false;
        
        // If this notification was triggered by the current device, don't show it here
        const originFingerprint = notifData?.origin_device_fingerprint as string | undefined;
        if (originFingerprint && originFingerprint === currentFingerprint) {
          return false; // Don't show on the device that just logged in
        }
        
        return true;
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
    getDeviceFingerprint,
    sendLoginPushNotification
  };
};
