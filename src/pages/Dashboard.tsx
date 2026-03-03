import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, CalendarDays, Megaphone, PiggyBank, ArrowRight, Cake, DollarSign, Plus, Pin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import AppNav from "@/components/AppNav";
import PullToRefresh from "@/components/PullToRefresh";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNjangiPeriod } from "@/hooks/useNjangi";
import { getDaysToDeadline, getDeadlineLabel, statusConfig } from "@/lib/njangi-utils";
import OnlineFamilyWidget from "@/components/chat/OnlineFamilyWidget";
import { useCreateDirectChat } from "@/hooks/useChat";
import GalleryCarousel from "@/components/dashboard/GalleryCarousel";
import NewsTicker from "@/components/dashboard/NewsTicker";

const sections = [
  {
    to: "/gallery",
    icon: Camera,
    emoji: "📸",
    title: "Family Gallery",
    desc: "Browse photos and videos organized by each family branch — Yvonne, Solo, Bankom, Nah & Nandet.",
    color: "from-primary/10 to-primary/5",
  },
  {
    to: "/events",
    icon: CalendarDays,
    emoji: "📅",
    title: "Events & Meetings",
    desc: "See upcoming family events, RSVP, and never miss a celebration or gathering.",
    color: "from-accent/60 to-accent/30",
  },
  {
    to: "/njangi",
    icon: PiggyBank,
    emoji: "💰",
    title: "Njangi",
    desc: "Track monthly family contributions, record payments, and view the annual schedule.",
    color: "from-muted to-muted/50",
  },
];

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const createDirectChat = useCreateDirectChat();
  const queryClient = useQueryClient();

  if (loading || !user) return null;

  const username = user.user_metadata?.username || user.user_metadata?.full_name || "Family Member";

  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
  };

  const handleAvatarClick = async (userId: string) => {
    try {
      const threadId = await createDirectChat(userId);
      if (threadId) navigate(`/chat?thread=${threadId}`);
    } catch {
      navigate("/chat");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <NewsTicker />
      <PullToRefresh onRefresh={handleRefresh}>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 md:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="font-display text-2xl sm:text-4xl font-bold mb-2">
            Hey, {username}! 🌟
          </h1>
          <p className="text-lg text-muted-foreground font-display">
            Welcome back to the Fomuso Family Hub 🏡
          </p>
        </motion.div>

        <OnlineFamilyWidget onAvatarClick={handleAvatarClick} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: "spring", bounce: 0.3 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className={`relative bg-gradient-to-br ${s.color} rounded-2xl border-2 border-border p-6 cursor-pointer`}
            >
              <Link to={s.to} className="block">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-background/80 flex items-center justify-center">
                    <s.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="font-display text-xl font-bold">{s.emoji} {s.title}</h2>
                </div>
                <p className="text-muted-foreground font-display text-sm mb-4">{s.desc}</p>
                {s.to === "/gallery" && <GalleryCarousel />}
                <Button variant="ghost" size="sm" className="rounded-full font-display p-0 text-primary hover:bg-transparent mt-2">
                  Explore <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </motion.div>
          ))}

          {/* Announcements Section */}
          <AnnouncementsCard user={user} />
        </div>

        <NjangiWidget user={user} />
        <BirthdaysThisMonth user={user} />
      </main>
      </PullToRefresh>
    </div>
  );
};

const AnnouncementsCard = ({ user }: { user: any }) => {
  const queryClient = useQueryClient();
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: isAdmin = false } = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      // Get author names
      const authorIds = [...new Set((data || []).map((p: any) => p.author_id))];
      if (authorIds.length === 0) return data || [];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", authorIds);
      const nameMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.full_name]));
      return (data || []).map((p: any) => ({ ...p, author_name: nameMap[p.author_id] || "Unknown" }));
    },
  });

  const createPost = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("posts").insert({
        author_id: user.id,
        title: title.trim(),
        content: content.trim(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setNewPostOpen(false);
      setTitle("");
      setContent("");
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase.from("posts").update({ is_pinned: !pinned } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: "spring", bounce: 0.3 }}
      className="relative bg-gradient-to-br from-secondary/60 to-secondary/30 rounded-2xl border-2 border-border p-6"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-background/80 flex items-center justify-center">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold">📢 Announcements</h2>
        </div>
        <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" className="rounded-full">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display">New Announcement 📢</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createPost.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label className="font-display">Title *</Label>
                <Input className="rounded-xl" placeholder="e.g., Family Meeting Update" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label className="font-display">Message *</Label>
                <Textarea className="rounded-xl" placeholder="Share your update with the family..." value={content} onChange={(e) => setContent(e.target.value)} required maxLength={2000} />
              </div>
              <Button type="submit" className="w-full rounded-full font-display" disabled={createPost.isPending}>
                {createPost.isPending ? "Posting... ⏳" : "Post Announcement 🎉"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {posts.length === 0 ? (
        <p className="text-muted-foreground font-display text-sm py-4 text-center">
          No announcements yet — post the first one! 📝
        </p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {posts.map((post: any) => (
            <div key={post.id} className="bg-background/60 rounded-xl p-3 relative group">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {post.is_pinned && <Pin className="h-3 w-3 text-primary flex-shrink-0" />}
                    <h4 className="font-display font-semibold text-sm truncate">{post.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {post.author_name} · {format(new Date(post.created_at), "MMM d")}
                  </p>
                </div>
                {(isAdmin || post.author_id === user.id) && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {isAdmin && (
                      <button onClick={() => togglePin.mutate({ id: post.id, pinned: post.is_pinned })} className="p-1 hover:bg-muted rounded-full">
                        <Pin className={`h-3 w-3 ${post.is_pinned ? "text-primary" : "text-muted-foreground"}`} />
                      </button>
                    )}
                    <button onClick={() => deletePost.mutate(post.id)} className="p-1 hover:bg-destructive/20 rounded-full">
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const BirthdaysThisMonth = ({ user }: { user: any }) => {
  const currentMonth = new Date().getMonth() + 1;

  const { data: birthdays = [] } = useQuery({
    queryKey: ["birthdays-this-month", currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("first_name, last_name, date_of_birth");
      if (error) throw error;
      return (data || [])
        .filter((m: any) => new Date(m.date_of_birth).getMonth() + 1 === currentMonth)
        .sort((a: any, b: any) => new Date(a.date_of_birth).getDate() - new Date(b.date_of_birth).getDate());
    },
    enabled: !!user,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-10"
    >
      <Card className="rounded-2xl border-2">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <Cake className="h-6 w-6 text-primary" />
          <CardTitle className="font-display text-xl">
            🎂 Birthdays in {format(new Date(), "MMMM")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {birthdays.length === 0 ? (
            <p className="text-muted-foreground text-sm font-display">No birthdays this month.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {birthdays.map((b: any, i: number) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-accent/40 px-4 py-3">
                  <span className="text-2xl">🎈</span>
                  <div>
                    <p className="font-display font-semibold text-sm">{b.first_name} {b.last_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(() => { const [y,m,d] = b.date_of_birth.split("-").map(Number); return format(new Date(y, m-1, d), "dd MMMM"); })()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const NjangiWidget = ({ user }: { user: any }) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const { data: period } = useNjangiPeriod(month, year);

  const expected = Number(period?.expected_total || 0);
  const remitted = Number(period?.total_remitted || 0);
  const balance = Number(period?.balance_left || 0);
  const daysLeft = getDaysToDeadline(year, month);
  const statusKey = (period?.status as keyof typeof statusConfig) || "not_started";
  const sc = statusConfig[statusKey];
  const pct = expected > 0 ? Math.min(100, (remitted / expected) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-10">
      <Card className="rounded-2xl border-2">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <CardTitle className="font-display text-xl">💰 Njangi — {format(now, "MMMM yyyy")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={pct} className="h-2 mb-3" />
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-4 gap-y-2 mb-3 text-sm font-display">
            <span>Expected: <strong>{expected.toLocaleString()} FCFA</strong></span>
            <span>Remitted: <strong className="text-primary">{remitted.toLocaleString()} FCFA</strong></span>
            <span>Left: <strong>{balance.toLocaleString()} FCFA</strong></span>
            <Badge className={`${sc.color} text-xs`}>{sc.emoji} {sc.label}</Badge>
            <span className="text-muted-foreground text-xs col-span-2 sm:col-span-1">{daysLeft >= 0 ? `${daysLeft} days left` : "Past deadline"}</span>
          </div>
          <Button asChild size="sm" className="rounded-full font-display">
            <Link to="/njangi">Open Njangi →</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Dashboard;
