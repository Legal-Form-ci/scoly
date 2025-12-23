import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean | null;
  created_at: string | null;
  data: unknown;
}

export const useRealtimeNotifications = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch existing notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [user]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Subscribe to new notifications for this user
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Add to state
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, toast]);

  // Subscribe to order updates for admins
  useEffect(() => {
    if (!user || !isAdmin) return;

    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newOrder = payload.new as { id: string; total_amount: number };
          
          toast({
            title: 'Nouvelle commande !',
            description: `Commande #${newOrder.id.slice(0, 8)} - ${newOrder.total_amount.toLocaleString()} FCFA`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
        },
        (payload) => {
          const payment = payload.new as { id: string; status: string; amount: number };
          
          if (payment.status === 'completed') {
            toast({
              title: 'Paiement confirmé !',
              description: `Paiement de ${payment.amount.toLocaleString()} FCFA reçu`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, toast]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};
