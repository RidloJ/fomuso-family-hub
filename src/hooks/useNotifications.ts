import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

const NOTIFICATION_SOUND_KEY = "chat-sound-enabled";
const NOTIFICATION_PUSH_KEY = "chat-push-enabled";

// Generate a simple notification sound using Web Audio API
const playNotificationSound = () => {
  try {
    const enabled = localStorage.getItem(NOTIFICATION_SOUND_KEY);
    if (enabled === "false") return;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Pleasant two-tone chime
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(830, now, 0.15);
    playTone(1100, now + 0.12, 0.2);
  } catch {
    // Audio not available
  }
};

const showBrowserNotification = async (senderName: string, content: string) => {
  const pushEnabled = localStorage.getItem(NOTIFICATION_PUSH_KEY);
  if (pushEnabled === "false") return;

  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  // Don't show if page is focused
  if (document.hasFocus()) {
    // Still play sound even when focused
    return;
  }

  const opts: NotificationOptions = {
    body: content.length > 80 ? content.slice(0, 80) + "…" : content,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: "chat-message",
  };

  const notification = new Notification(`💬 ${senderName}`, opts);

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  // Auto-close after 5 seconds
  setTimeout(() => notification.close(), 5000);
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

export const useMessageNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const activeThreadRef = useRef<string | null>(null);

  const setActiveThread = useCallback((threadId: string | null) => {
    activeThreadRef.current = threadId;
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("message-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        async (payload) => {
          const msg = payload.new as {
            sender_id: string;
            content: string;
            thread_id: string;
            is_deleted: boolean;
          };

          // Don't notify for own messages or deleted
          if (msg.sender_id === user.id || msg.is_deleted) return;

          // Don't notify if user is viewing this thread
          if (activeThreadRef.current === msg.thread_id) return;

          // Play sound
          playNotificationSound();

          // Get sender name for push notification
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", msg.sender_id)
            .single();

          showBrowserNotification(
            profile?.full_name || "Family Member",
            msg.content
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { setActiveThread };
};

export const isSoundEnabled = () => localStorage.getItem(NOTIFICATION_SOUND_KEY) !== "false";
export const isPushEnabled = () => localStorage.getItem(NOTIFICATION_PUSH_KEY) !== "false";
export const setSoundEnabled = (v: boolean) => localStorage.setItem(NOTIFICATION_SOUND_KEY, String(v));
export const setPushEnabled = (v: boolean) => localStorage.setItem(NOTIFICATION_PUSH_KEY, String(v));
