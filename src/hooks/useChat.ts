import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type ReadStatus = "sent" | "delivered" | "read";

export interface ChatThread {
  id: string;
  type: "group" | "direct";
  title: string | null;
  created_by: string;
  created_at: string;
  lastMessage?: {
    content: string;
    created_at: string;
    sender_name: string;
  };
  unreadCount?: number;
  members?: { member_id: string; full_name: string; avatar_url: string | null; last_seen_at: string | null }[];
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  is_deleted: boolean;
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  sender?: { full_name: string; avatar_url: string | null };
}

export const useThreads = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["chat-threads", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // 1. Get thread IDs the user belongs to
      const { data: memberThreads, error: mtErr } = await supabase
        .from("chat_thread_members")
        .select("thread_id")
        .eq("member_id", user.id);
      if (mtErr) throw mtErr;
      if (!memberThreads?.length) return [];

      const threadIds = memberThreads.map((m) => m.thread_id);

      // 2. Fetch all threads in one query
      const { data: threads, error: tErr } = await supabase
        .from("chat_threads")
        .select("*")
        .in("id", threadIds)
        .order("created_at", { ascending: true });
      if (tErr) throw tErr;
      if (!threads?.length) return [];

      // 3. Fetch ALL members for ALL threads in one query
      const { data: allMembers } = await supabase
        .from("chat_thread_members")
        .select("thread_id, member_id")
        .in("thread_id", threadIds);

      // 4. Fetch ALL relevant profiles in one query
      const allMemberIds = [...new Set((allMembers || []).map((m) => m.member_id))];
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, last_seen_at")
        .in("user_id", allMemberIds);

      const profileMap = new Map(
        (allProfiles || []).map((p) => [p.user_id, p])
      );

      // 5. Fetch the latest message per thread using a single query
      // Get last messages for all threads at once
      const { data: allMessages } = await supabase
        .from("chat_messages")
        .select("thread_id, content, created_at, sender_id")
        .in("thread_id", threadIds)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      // Build a map of thread_id -> latest message
      const lastMessageMap = new Map<string, { content: string; created_at: string; sender_id: string }>();
      for (const msg of allMessages || []) {
        if (!lastMessageMap.has(msg.thread_id)) {
          lastMessageMap.set(msg.thread_id, msg);
        }
      }

      // 6. Build members map per thread
      const threadMembersMap = new Map<string, typeof allMembers>();
      for (const m of allMembers || []) {
        if (!threadMembersMap.has(m.thread_id)) {
          threadMembersMap.set(m.thread_id, []);
        }
        threadMembersMap.get(m.thread_id)!.push(m);
      }

      // 7. Assemble threads
      const threadsWithInfo: ChatThread[] = threads.map((thread) => {
        const members = threadMembersMap.get(thread.id) || [];
        const memberProfiles = members
          .map((m) => profileMap.get(m.member_id))
          .filter(Boolean) as NonNullable<ReturnType<typeof profileMap.get>>[];

        const lastMsg = lastMessageMap.get(thread.id);
        let senderName = "";
        if (lastMsg) {
          senderName = profileMap.get(lastMsg.sender_id)?.full_name || "Unknown";
        }

        // For direct chats, set title to other person's name
        let title = thread.title;
        if (thread.type === "direct") {
          const other = memberProfiles.find((p) => p.user_id !== user.id);
          title = other?.full_name || "Direct Chat";
        }

        return {
          ...thread,
          type: thread.type as "group" | "direct",
          title,
          lastMessage: lastMsg
            ? { content: lastMsg.content, created_at: lastMsg.created_at, sender_name: senderName }
            : undefined,
          members: memberProfiles.map((p) => ({
            member_id: p.user_id,
            full_name: p.full_name,
            avatar_url: p.avatar_url,
            last_seen_at: p.last_seen_at,
          })),
        };
      });

      // Sort: group first, then by last message time
      return threadsWithInfo.sort((a, b) => {
        if (a.type === "group" && b.type !== "group") return -1;
        if (b.type === "group" && a.type !== "group") return 1;
        const aTime = a.lastMessage?.created_at || a.created_at;
        const bTime = b.lastMessage?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
    },
    enabled: !!user,
    staleTime: 10000, // Cache for 10s to avoid rapid refetches
  });
};

export const useReadReceipts = (threadId: string | null, currentUserId: string) => {
  return useQuery({
    queryKey: ["read-receipts", threadId],
    queryFn: async () => {
      if (!threadId) return [];
      const { data, error } = await supabase
        .from("chat_thread_members")
        .select("member_id, last_read_at")
        .eq("thread_id", threadId)
        .neq("member_id", currentUserId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!threadId,
    refetchInterval: 10000,
    staleTime: 5000,
  });
};

export const getMessageReadStatus = (
  messageCreatedAt: string,
  otherMembers: { member_id: string; last_read_at: string | null }[]
): ReadStatus => {
  if (!otherMembers.length) return "sent";
  const msgTime = new Date(messageCreatedAt).getTime();
  const allRead = otherMembers.every(
    (m) => m.last_read_at && new Date(m.last_read_at).getTime() >= msgTime
  );
  if (allRead) return "read";
  const anyRead = otherMembers.some(
    (m) => m.last_read_at && new Date(m.last_read_at).getTime() >= msgTime
  );
  if (anyRead) return "delivered";
  return "sent";
};

export const useMessages = (threadId: string | null) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["chat-messages", threadId],
    queryFn: async () => {
      if (!threadId) return [];

      // Fetch messages and profiles in parallel
      const messagesPromise = supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      const { data: messages, error } = await messagesPromise;
      if (error) throw error;
      if (!messages?.length) return [];

      const senderIds = [...new Set(messages.map((m) => m.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", senderIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      return messages.map((m) => ({
        ...m,
        sender: profileMap.get(m.sender_id) || {
          full_name: "Unknown",
          avatar_url: null,
        },
      })) as ChatMessage[];
    },
    enabled: !!threadId,
    staleTime: 5000,
  });

  // Subscribe to realtime messages
  useEffect(() => {
    if (!threadId) return;

    const channel = supabase
      .channel(`messages-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat-messages", threadId] });
          queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, queryClient]);

  return query;
};

export const useSendMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useCallback(
    async (
      threadId: string,
      content: string,
      attachment?: { url: string; type: string; name: string }
    ) => {
      if (!user || (!content.trim() && !attachment)) return;

      const { error } = await supabase.from("chat_messages").insert({
        thread_id: threadId,
        sender_id: user.id,
        content: content.trim(),
        attachment_url: attachment?.url || null,
        attachment_type: attachment?.type || null,
        attachment_name: attachment?.name || null,
      });
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["chat-messages", threadId] });
      queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
    },
    [user, queryClient]
  );
};

export const useEnsureGroupChat = () => {
  const { user } = useAuth();

  return useCallback(async () => {
    if (!user) return;

    // Check if a group chat already exists
    const { data: existingThreads } = await supabase
      .from("chat_threads")
      .select("id, created_at")
      .eq("type", "group")
      .eq("title", "Family Group Chat")
      .order("created_at", { ascending: true });

    if (existingThreads && existingThreads.length > 0) {
      // Clean up duplicates: keep only the oldest one
      if (existingThreads.length > 1) {
        const duplicateIds = existingThreads.slice(1).map((t) => t.id);
        for (const dupId of duplicateIds) {
          await supabase.from("chat_thread_members").delete().eq("thread_id", dupId);
          await supabase.from("chat_messages").delete().eq("thread_id", dupId);
          await supabase.from("chat_threads").delete().eq("id", dupId);
        }
      }
      return existingThreads[0].id;
    }

    // Create family group chat
    const { data: thread, error: tErr } = await supabase
      .from("chat_threads")
      .insert({ type: "group", title: "Family Group Chat", created_by: user.id })
      .select()
      .single();
    if (tErr) throw tErr;

    // Add creator + all approved members in parallel
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("is_approved", true)
      .neq("user_id", user.id);

    const members = [
      { thread_id: thread.id, member_id: user.id },
      ...(profiles || []).map((p) => ({ thread_id: thread.id, member_id: p.user_id })),
    ];
    await supabase.from("chat_thread_members").insert(members);

    return thread.id;
  }, [user]);
};

export const useCreateGroupChat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useCallback(
    async (title: string, memberIds: string[]) => {
      if (!user) return null;

      const { data: newThread, error } = await supabase
        .from("chat_threads")
        .insert({ type: "group", title, created_by: user.id })
        .select()
        .single();
      if (error) throw error;

      const members = [user.id, ...memberIds].map((id) => ({
        thread_id: newThread.id,
        member_id: id,
      }));
      await supabase.from("chat_thread_members").insert(members);

      queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
      return newThread.id;
    },
    [user, queryClient]
  );
};

export const useCreateDirectChat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useCallback(
    async (otherUserId: string) => {
      if (!user) return null;

      // Check if direct chat already exists — batch approach
      const { data: myThreads } = await supabase
        .from("chat_thread_members")
        .select("thread_id")
        .eq("member_id", user.id);

      if (myThreads?.length) {
        const myThreadIds = myThreads.map((t) => t.thread_id);

        // Get all direct threads in one query
        const { data: directThreads } = await supabase
          .from("chat_threads")
          .select("id")
          .in("id", myThreadIds)
          .eq("type", "direct");

        if (directThreads?.length) {
          const directIds = directThreads.map((t) => t.id);

          // Check if other user is in any of these threads
          const { data: otherMemberships } = await supabase
            .from("chat_thread_members")
            .select("thread_id")
            .in("thread_id", directIds)
            .eq("member_id", otherUserId);

          if (otherMemberships?.length) {
            return otherMemberships[0].thread_id;
          }
        }
      }

      // Create new direct chat
      const { data: newThread, error } = await supabase
        .from("chat_threads")
        .insert({ type: "direct", created_by: user.id })
        .select()
        .single();
      if (error) throw error;

      await supabase.from("chat_thread_members").insert([
        { thread_id: newThread.id, member_id: user.id },
        { thread_id: newThread.id, member_id: otherUserId },
      ]);

      queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
      return newThread.id;
    },
    [user, queryClient]
  );
};
