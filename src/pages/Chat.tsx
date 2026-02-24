import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AppNav from "@/components/AppNav";
import { useThreads, useMessages, useSendMessage, useEnsureGroupChat, useCreateDirectChat, ChatThread, ChatMessage } from "@/hooks/useChat";
import { usePresence } from "@/hooks/usePresence";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Send, MessageCircle, Search, Plus, MoreVertical, Pencil, Trash2, X, Check } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";

const Chat = () => {
  const { user, loading } = useAuth();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [showMobileMessages, setShowMobileMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const ensureGroupChat = useEnsureGroupChat();
  const createDirectChat = useCreateDirectChat();
  const onlineUsers = usePresence();

  const { data: threads = [], isLoading: threadsLoading } = useThreads();

  useEffect(() => {
    if (user) ensureGroupChat();
  }, [user, ensureGroupChat]);

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setShowMobileMessages(true);
    setShowNewChat(false);
  };

  const handleStartDirectChat = async (otherUserId: string) => {
    try {
      const threadId = await createDirectChat(otherUserId);
      if (threadId) {
        setSelectedThreadId(threadId);
        setShowMobileMessages(true);
        setShowNewChat(false);
      }
    } catch {
      toast.error("Failed to start chat");
    }
  };

  const handleBack = () => {
    setShowMobileMessages(false);
    setSelectedThreadId(null);
  };

  const filteredThreads = threads.filter((t) =>
    !searchQuery || (t.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNav />
      <div className="flex-1 max-w-6xl mx-auto w-full flex overflow-hidden" style={{ height: "calc(100vh - 73px)" }}>
        {/* Thread list sidebar */}
        <div className={`w-full md:w-80 md:min-w-[320px] border-r border-border flex flex-col bg-card ${showMobileMessages ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">💬 Chats</h2>
              <Button
                variant={showNewChat ? "default" : "ghost"}
                size="sm"
                className="rounded-full"
                onClick={() => setShowNewChat(!showNewChat)}
              >
                {showNewChat ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-full"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {showNewChat && (
              <NewChatPanel
                onStartChat={handleStartDirectChat}
                onClose={() => setShowNewChat(false)}
                currentUserId={user?.id || ""}
              />
            )}
            {threadsLoading ? (
              <div className="p-4 text-center text-muted-foreground font-display text-sm">Loading chats...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground font-display text-sm">No chats yet</div>
            ) : (
              filteredThreads.map((thread) => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isActive={selectedThreadId === thread.id}
                  onClick={() => handleSelectThread(thread.id)}
                  currentUserId={user?.id || ""}
                  onlineUserIds={onlineUsers.map((u) => u.user_id)}
                />
              ))
            )}
          </ScrollArea>
        </div>

        {/* Message panel */}
        <div className={`flex-1 flex flex-col bg-muted/30 ${!showMobileMessages ? "hidden md:flex" : "flex"}`}>
          {selectedThread ? (
            <MessagePanel
              thread={selectedThread}
              onBack={handleBack}
              currentUserId={user?.id || ""}
              onlineUserIds={onlineUsers.map((u) => u.user_id)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/20">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="font-display text-lg text-muted-foreground">Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Thread list item
const ThreadItem = ({
  thread,
  isActive,
  onClick,
  currentUserId,
  onlineUserIds,
}: {
  thread: ChatThread;
  isActive: boolean;
  onClick: () => void;
  currentUserId: string;
  onlineUserIds: string[];
}) => {
  const otherMember = thread.members?.find((m) => m.member_id !== currentUserId);
  const isOnline = thread.type === "direct" && otherMember && onlineUserIds.includes(otherMember.member_id);
  const avatarUrl = thread.type === "direct" ? otherMember?.avatar_url : null;
  const initials = thread.type === "group"
    ? "👨‍👩‍👧‍👦"
    : (otherMember?.full_name || "?").split(" ").map((n) => n[0]).join("").toUpperCase();

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d");
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50 ${
        isActive ? "bg-primary/10 border-l-2 border-l-primary" : ""
      }`}
    >
      <div className="relative">
        <Avatar className="h-11 w-11">
          <AvatarImage src={avatarUrl || ""} />
          <AvatarFallback className="text-sm font-display">{initials}</AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-warm-green border-2 border-background" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-display font-semibold text-sm truncate">
            {thread.type === "group" ? "👨‍👩‍👧‍👦 " : ""}{thread.title || "Chat"}
          </p>
          {thread.lastMessage && (
            <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
              {formatTime(thread.lastMessage.created_at)}
            </span>
          )}
        </div>
        {thread.lastMessage && (
          <p className="text-xs text-muted-foreground truncate">
            {thread.lastMessage.sender_name}: {thread.lastMessage.content}
          </p>
        )}
      </div>
    </button>
  );
};

// Message panel
const MessagePanel = ({
  thread,
  onBack,
  currentUserId,
  onlineUserIds,
}: {
  thread: ChatThread;
  onBack: () => void;
  currentUserId: string;
  onlineUserIds: string[];
}) => {
  const { data: messages = [], isLoading } = useMessages(thread.id);
  const sendMessage = useSendMessage();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(thread.id, input);
      setInput("");
    } catch {
      toast.error("Failed to send message");
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEditStart = (msg: ChatMessage) => {
    setEditingId(msg.id);
    setEditContent(msg.content);
  };

  const handleEditSave = async () => {
    if (!editingId || !editContent.trim()) return;
    const { error } = await supabase
      .from("chat_messages")
      .update({ content: editContent.trim(), edited_at: new Date().toISOString() })
      .eq("id", editingId);
    if (error) {
      toast.error("Failed to edit message");
    } else {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", thread.id] });
      toast.success("Message edited ✏️");
    }
    setEditingId(null);
    setEditContent("");
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleDelete = async (msgId: string) => {
    const { error } = await supabase
      .from("chat_messages")
      .update({ is_deleted: true, content: "" })
      .eq("id", msgId);
    if (error) {
      toast.error("Failed to delete message");
    } else {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", thread.id] });
      queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
      toast.success("Message deleted 🗑️");
    }
  };

  const onlineMemberCount = thread.members?.filter(
    (m) => m.member_id === currentUserId || onlineUserIds.includes(m.member_id)
  ).length || 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Button variant="ghost" size="sm" className="md:hidden rounded-full" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <p className="font-display font-semibold text-sm">
            {thread.type === "group" ? "👨‍👩‍👧‍👦 " : ""}{thread.title || "Chat"}
          </p>
          <p className="text-xs text-muted-foreground">
            {thread.type === "group"
              ? `${thread.members?.length || 0} members • ${onlineMemberCount} online`
              : onlineUserIds.includes(
                  thread.members?.find((m) => m.member_id !== currentUserId)?.member_id || ""
                )
              ? "🟢 Online"
              : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="text-center text-muted-foreground font-display text-sm py-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground font-display text-sm py-8">
            No messages yet. Say hello! 👋
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.sender_id === currentUserId;
            const showAvatar =
              !isMine &&
              (i === 0 || messages[i - 1].sender_id !== msg.sender_id);
            const isEditing = editingId === msg.id;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMine ? "justify-end" : "justify-start"} group`}
              >
                <div className={`flex gap-2 max-w-[80%] ${isMine ? "flex-row-reverse" : ""}`}>
                  {!isMine && showAvatar ? (
                    <Avatar className="h-7 w-7 mt-1 flex-shrink-0">
                      <AvatarImage src={msg.sender?.avatar_url || ""} />
                      <AvatarFallback className="text-[10px] font-display">
                        {(msg.sender?.full_name || "?")[0]}
                      </AvatarFallback>
                    </Avatar>
                  ) : !isMine ? (
                    <div className="w-7 flex-shrink-0" />
                  ) : null}
                  <div className="relative">
                    {!isMine && showAvatar && (
                      <p className="text-[10px] font-display font-semibold text-muted-foreground mb-0.5 ml-1">
                        {msg.sender?.full_name}
                      </p>
                    )}

                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditSave();
                            if (e.key === "Escape") handleEditCancel();
                          }}
                          className="text-sm h-8 rounded-full"
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-full" onClick={handleEditSave}>
                          <Check className="h-3.5 w-3.5 text-primary" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-full" onClick={handleEditCancel}>
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {isMine && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity order-first">
                            {!msg.is_deleted && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
                                    <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[120px]">
                                  <DropdownMenuItem onClick={() => handleEditStart(msg)} className="text-xs">
                                    <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDelete(msg.id)} className="text-xs text-destructive">
                                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        )}
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm ${
                            isMine
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-card border border-border rounded-bl-sm"
                          }`}
                        >
                          {msg.is_deleted ? (
                            <span className="italic text-muted-foreground text-xs">🚫 Message deleted</span>
                          ) : (
                            <>
                              {msg.content}
                              {msg.edited_at && (
                                <span className="text-[9px] opacity-60 ml-1">(edited)</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <p className={`text-[9px] text-muted-foreground mt-0.5 ${isMine ? "text-right mr-1" : "ml-1"}`}>
                      {format(new Date(msg.created_at), "h:mm a")}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-border bg-card">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="rounded-full flex-1"
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            size="sm"
            className="rounded-full h-10 w-10 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

// New chat panel
const NewChatPanel = ({
  onStartChat,
  onClose,
  currentUserId,
}: {
  onStartChat: (userId: string) => void;
  onClose: () => void;
  currentUserId: string;
}) => {
  const { data: profiles = [] } = useQuery({
    queryKey: ["all-profiles-chat"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .eq("is_approved", true)
        .neq("user_id", currentUserId);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="border-b-2 border-primary/20 bg-primary/5">
      <div className="p-3 flex items-center justify-between gap-2">
        <p className="font-display font-semibold text-sm flex-shrink-0">✨ New Chat</p>
        <Button variant="destructive" size="sm" onClick={onClose} className="text-xs rounded-full h-7 px-4 flex-shrink-0">
          Cancel
        </Button>
      </div>
      {profiles.map((p) => {
        const initials = p.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase();
        return (
          <button
            key={p.user_id}
            onClick={() => onStartChat(p.user_id)}
            className="w-full flex items-center gap-3 p-3 hover:bg-primary/10 transition-colors"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={p.avatar_url || ""} />
              <AvatarFallback className="text-xs font-display">{initials}</AvatarFallback>
            </Avatar>
            <span className="font-display text-sm">{p.full_name}</span>
          </button>
        );
      })}
      {profiles.length === 0 && (
        <p className="p-4 text-center text-muted-foreground text-sm font-display">No family members found</p>
      )}
    </div>
  );
};

export default Chat;
