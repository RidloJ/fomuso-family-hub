import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface OnlineUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

export const usePresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch current user's profile
    const setupPresence = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .single();

      const channel = supabase.channel("family-presence", {
        config: { presence: { key: user.id } },
      });

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const users: OnlineUser[] = [];
          Object.keys(state).forEach((key) => {
            const presences = state[key] as any[];
            if (presences.length > 0 && key !== user.id) {
              users.push({
                user_id: key,
                full_name: presences[0].full_name || "",
                avatar_url: presences[0].avatar_url || null,
              });
            }
          });
          setOnlineUsers(users);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({
              user_id: user.id,
              full_name: profile?.full_name || "",
              avatar_url: profile?.avatar_url || null,
              online_at: new Date().toISOString(),
            });
          }
        });

      // Update last_seen_at periodically
      const interval = setInterval(async () => {
        await supabase
          .from("profiles")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("user_id", user.id);
      }, 60000);

      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupPresence();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [user]);

  return onlineUsers;
};
