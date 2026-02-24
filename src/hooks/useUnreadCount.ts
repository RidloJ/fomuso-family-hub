import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useUnreadCount = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["unread-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;

      // Get all threads the user belongs to with their last_read_at
      const { data: memberships, error: mErr } = await supabase
        .from("chat_thread_members")
        .select("thread_id, last_read_at")
        .eq("member_id", user.id);
      if (mErr || !memberships?.length) return 0;

      let total = 0;
      for (const m of memberships) {
        const { count, error } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("thread_id", m.thread_id)
          .eq("is_deleted", false)
          .neq("sender_id", user.id)
          .gt("created_at", m.last_read_at || "1970-01-01T00:00:00Z");
        if (!error && count) total += count;
      }
      return total;
    },
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30s
  });

  // Listen for new messages across all threads
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("unread-badge")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["unread-count", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query.data || 0;
};

export const useMarkThreadRead = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return async (threadId: string) => {
    if (!user) return;
    await supabase
      .from("chat_thread_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("thread_id", threadId)
      .eq("member_id", user.id);
    queryClient.invalidateQueries({ queryKey: ["unread-count", user.id] });
  };
};
