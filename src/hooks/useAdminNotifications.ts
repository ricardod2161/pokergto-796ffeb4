import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type NotificationType = "new_user" | "plan_upgrade" | "plan_downgrade" | "subscription_canceled";

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: {
    userId?: string;
    email?: string;
    fullName?: string;
    oldPlan?: string;
    newPlan?: string;
  };
}

interface ProfilePayload {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

interface SubscriptionPayload {
  id: string;
  user_id: string;
  plan: "free" | "pro" | "premium";
  status: string;
  updated_at: string;
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  premium: "Premium",
};

export function useAdminNotifications() {
  const { isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification: Omit<AdminNotification, "id" | "timestamp" | "read">) => {
    const newNotification: AdminNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    setUnreadCount(prev => prev + 1);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    // Subscribe to new profile insertions (new user registrations)
    const profilesChannel = supabase
      .channel("admin-profiles")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "profiles",
        },
        (payload: RealtimePostgresChangesPayload<ProfilePayload>) => {
          const newProfile = payload.new as ProfilePayload;
          if (newProfile) {
            addNotification({
              type: "new_user",
              title: "Novo Usuário",
              message: `${newProfile.full_name || newProfile.email} acabou de se cadastrar`,
              data: {
                userId: newProfile.user_id,
                email: newProfile.email,
                fullName: newProfile.full_name || undefined,
              },
            });
          }
        }
      )
      .subscribe();

    // Subscribe to subscription updates (plan changes)
    const subscriptionsChannel = supabase
      .channel("admin-subscriptions")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "subscriptions",
        },
        async (payload: RealtimePostgresChangesPayload<SubscriptionPayload>) => {
          const oldSub = payload.old as SubscriptionPayload;
          const newSub = payload.new as SubscriptionPayload;

          if (!oldSub || !newSub) return;
          if (oldSub.plan === newSub.plan && oldSub.status === newSub.status) return;

          // Get user email for the notification
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("user_id", newSub.user_id)
            .single();

          const userName = profile?.full_name || profile?.email || "Usuário";

          // Plan changed
          if (oldSub.plan !== newSub.plan) {
            const isUpgrade =
              (oldSub.plan === "free" && (newSub.plan === "pro" || newSub.plan === "premium")) ||
              (oldSub.plan === "pro" && newSub.plan === "premium");

            addNotification({
              type: isUpgrade ? "plan_upgrade" : "plan_downgrade",
              title: isUpgrade ? "Upgrade de Plano! 🎉" : "Downgrade de Plano",
              message: `${userName} mudou de ${PLAN_LABELS[oldSub.plan]} para ${PLAN_LABELS[newSub.plan]}`,
              data: {
                userId: newSub.user_id,
                email: profile?.email,
                fullName: profile?.full_name || undefined,
                oldPlan: oldSub.plan,
                newPlan: newSub.plan,
              },
            });
          }

          // Status changed to canceled
          if (oldSub.status !== "canceled" && newSub.status === "canceled") {
            addNotification({
              type: "subscription_canceled",
              title: "Assinatura Cancelada",
              message: `${userName} cancelou a assinatura ${PLAN_LABELS[newSub.plan]}`,
              data: {
                userId: newSub.user_id,
                email: profile?.email,
                fullName: profile?.full_name || undefined,
                oldPlan: newSub.plan,
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(subscriptionsChannel);
    };
  }, [isAdmin, addNotification]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}
