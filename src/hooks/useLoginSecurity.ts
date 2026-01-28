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

  // Generate a unique device fingerprint - more robust version
  const getDeviceFingerprint = useCallback(() => {
    const ua = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const screen = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const colorDepth = window.screen.colorDepth;
    
    // Create a more unique hash-like string for this device
    const fingerprint = btoa(`${ua}|${platform}|${language}|${screen}|${timezone}|${colorDepth}`).slice(0, 48);
    return fingerprint;
  }, []);

  // Store fingerprint in localStorage on login
  const storeDeviceFingerprint = useCallback(() => {
    const fingerprint = getDeviceFingerprint();
    localStorage.setItem('device_fingerprint', fingerprint);
    localStorage.setItem('device_fingerprint_timestamp', Date.now().toString());
    return fingerprint;
  }, [getDeviceFingerprint]);

  // Get stored fingerprint
  const getStoredFingerprint = useCallback(() => {
    return localStorage.getItem('device_fingerprint') || '';
  }, []);

  // Send push notification to OTHER devices (not the current one)
  const sendLoginPushNotification = useCallback(async (
    userId: string, 
    deviceInfo: string, 
    ipAddress: string, 
    currentDeviceFingerprint: string,
    sessionId: string
  ) => {
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
          origin_device_fingerprint: currentDeviceFingerprint, // The device that triggered this
          session_id: sessionId, // For blocking
          created_at: new Date().toISOString()
        },
        is_read: false
      });

      if (notifError) {
        console.error('[Push] Error storing notification:', notifError);
      } else {
        console.log('[Push] Login notification created for other devices (excluding current)');
      }
    } catch (error) {
      console.error('[Push] Failed to send login notification:', error);
    }
  }, []);

  // Record login session
  const recordLoginSession = useCallback(async (userId: string) => {
    try {
      const deviceInfo = getDeviceInfo();
      
      // Store AND get the fingerprint for this device
      const deviceFingerprint = storeDeviceFingerprint();
      
      // Get IP from a service (in production, this would be from the server)
      let ipAddress = 'Non disponible';
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ipAddress = data.ip;
      } catch {
        console.log('Could not fetch IP');
      }

      // Create login session
      const { data: sessionData, error } = await supabase
        .from('login_sessions')
        .insert({
          user_id: userId,
          device_info: deviceInfo,
          ip_address: ipAddress
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording login session:', error);
        return;
      }

      // Send push notification to OTHER devices only (not current)
      await sendLoginPushNotification(
        userId, 
        deviceInfo, 
        ipAddress, 
        deviceFingerprint,
        sessionData.id
      );
      
    } catch (error) {
      console.error('Error in recordLoginSession:', error);
    }
  }, [getDeviceInfo, storeDeviceFingerprint, sendLoginPushNotification]);

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

  // Get pending confirmation sessions (for OTHER devices only)
  const getPendingConfirmations = useCallback(async () => {
    if (!user) return [];

    const currentFingerprint = getStoredFingerprint();

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
  }, [user, getStoredFingerprint]);

  // Block a login session (called when user clicks "Not me")
  const blockLoginSession = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('login_sessions')
        .update({
          is_blocked: true,
          is_confirmed: false,
          confirmed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error blocking session:', error);
      return false;
    }
  }, []);

  // Confirm a login session (called when user clicks "Yes, it's me")
  const confirmLoginSession = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('login_sessions')
        .update({
          is_confirmed: true,
          is_blocked: false,
          confirmed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error confirming session:', error);
      return false;
    }
  }, []);

  // Add device to trusted devices
  const trustDevice = useCallback(async (sessionId: string) => {
    // In a full implementation, you'd store trusted device fingerprints
    // For now, we just mark the session as confirmed
    return confirmLoginSession(sessionId);
  }, [confirmLoginSession]);

  return {
    recordLoginSession,
    checkBlockedSessions,
    getPendingConfirmations,
    getDeviceInfo,
    getDeviceFingerprint,
    getStoredFingerprint,
    storeDeviceFingerprint,
    sendLoginPushNotification,
    blockLoginSession,
    confirmLoginSession,
    trustDevice
  };
};
