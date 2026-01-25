import { useState, useEffect, useMemo } from 'react';
import { Bell, Check, CheckCheck, Package, CreditCard, Newspaper, Heart, MessageCircle, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import LoginSecurityAlert from './LoginSecurityAlert';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [securityAlert, setSecurityAlert] = useState<any>(null);
  const [dismissedSecurityIds, setDismissedSecurityIds] = useState<Set<string>>(() => new Set());
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading, securityNotifications } = useRealtimeNotifications();

  const nextSecurityNotification = useMemo(() => {
    return securityNotifications.find((n: any) => n?.id && !dismissedSecurityIds.has(n.id)) || null;
  }, [securityNotifications, dismissedSecurityIds]);

  // Show security alert if there are pending confirmations
  useEffect(() => {
    if (nextSecurityNotification && !securityAlert) {
      setSecurityAlert(nextSecurityNotification);
    }
  }, [nextSecurityNotification, securityAlert]);

  const handleCloseSecurityAlert = async () => {
    if (!securityAlert?.id) {
      setSecurityAlert(null);
      return;
    }

    // Prevent infinite reopen loops even if the DB update is delayed/fails.
    setDismissedSecurityIds(prev => {
      const next = new Set(prev);
      next.add(securityAlert.id);
      return next;
    });

    // Best-effort: mark as read in DB + update local state (hook)
    try {
      await markAsRead(securityAlert.id);
    } catch {
      // markAsRead already logs internally; keep UI usable.
    } finally {
      setSecurityAlert(null);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package size={16} className="text-primary" />;
      case 'payment':
        return <CreditCard size={16} className="text-green-500" />;
      case 'article':
        return <Newspaper size={16} className="text-blue-500" />;
      case 'reaction':
        return <Heart size={16} className="text-pink-500" />;
      case 'comment':
        return <MessageCircle size={16} className="text-orange-500" />;
      case 'security':
        return <Shield size={16} className="text-red-500" />;
      default:
        return <Bell size={16} className="text-muted-foreground" />;
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    const data = notification.data as Record<string, any> | null;
    if (data?.article_id && (notification.type === 'reaction' || notification.type === 'comment')) {
      setOpen(false);
      navigate(`/actualites/${data.article_id}`);
    } else if (data?.order_id && notification.type === 'order') {
      setOpen(false);
      navigate('/account');
    }
  };

  return (
    <>
      {securityAlert && (
        <LoginSecurityAlert
          notification={securityAlert}
          onClose={handleCloseSecurityAlert}
        />
      )}
      <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck size={14} className="mr-1" />
              Tout lire
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Bell size={32} className="mb-2 opacity-50" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
      </Popover>
    </>
  );
};

export default NotificationBell;
