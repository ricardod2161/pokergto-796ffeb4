import { useState } from "react";
import { 
  Bell, 
  UserPlus, 
  TrendingUp, 
  TrendingDown, 
  XCircle,
  Check,
  CheckCheck,
  Trash2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AdminNotification, NotificationType } from "@/hooks/useAdminNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdminNotificationsProps {
  notifications: AdminNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClear: () => void;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "new_user":
      return <UserPlus className="w-4 h-4 text-primary" />;
    case "plan_upgrade":
      return <TrendingUp className="w-4 h-4 text-success" />;
    case "plan_downgrade":
      return <TrendingDown className="w-4 h-4 text-amber-500" />;
    case "subscription_canceled":
      return <XCircle className="w-4 h-4 text-destructive" />;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case "new_user":
      return "bg-primary/10 border-primary/20";
    case "plan_upgrade":
      return "bg-success/10 border-success/20";
    case "plan_downgrade":
      return "bg-amber-500/10 border-amber-500/20";
    case "subscription_canceled":
      return "bg-destructive/10 border-destructive/20";
  }
};

export function AdminNotifications({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClear,
}: AdminNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative border-border gap-2"
        >
          <Bell className={cn("w-4 h-4", unreadCount > 0 && "text-primary")} />
          <span className="hidden sm:inline">Notificações</span>
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-80 sm:w-96 p-0 bg-card border-border"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Notificações</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} nova{unreadCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="h-7 px-2 text-xs"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Ler todas
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Novas atividades aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 transition-colors hover:bg-muted/30 cursor-pointer",
                    !notification.read && "bg-muted/20"
                  )}
                  onClick={() => !notification.read && onMarkAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border",
                      getNotificationColor(notification.type)
                    )}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm",
                          !notification.read ? "font-semibold text-foreground" : "text-foreground/80"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(notification.timestamp, {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator className="bg-border" />
            <div className="p-2 text-center">
              <p className="text-xs text-muted-foreground">
                Mostrando {notifications.length} notificaç{notifications.length === 1 ? "ão" : "ões"}
              </p>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
