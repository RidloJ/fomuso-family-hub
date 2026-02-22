import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, CalendarDays, Megaphone, PiggyBank, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import AppNav from "@/components/AppNav";

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
    to: "#",
    icon: Megaphone,
    emoji: "📢",
    title: "Updates & Announcements",
    desc: "Stay in the loop with family news, pinned announcements, and shared updates.",
    color: "from-secondary/60 to-secondary/30",
    comingSoon: true,
  },
  {
    to: "#",
    icon: PiggyBank,
    emoji: "💰",
    title: "Contributions & Projects",
    desc: "Track family projects, contributions, and progress toward shared goals.",
    color: "from-muted to-muted/50",
    comingSoon: true,
  },
];

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  const name = user.user_metadata?.full_name || "Family Member";

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="font-display text-4xl font-bold mb-2">
            Hey, {name}! 🌟
          </h1>
          <p className="text-lg text-muted-foreground font-display">
            Welcome back to the Fomuso Family Hub 🏡
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: "spring", bounce: 0.3 }}
              whileHover={s.comingSoon ? {} : { y: -4, scale: 1.01 }}
              className={`relative bg-gradient-to-br ${s.color} rounded-2xl border-2 border-border p-6 ${s.comingSoon ? "opacity-60" : "cursor-pointer"}`}
            >
              {s.comingSoon ? (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-background/80 flex items-center justify-center">
                      <s.icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h2 className="font-display text-xl font-bold">{s.emoji} {s.title}</h2>
                  </div>
                  <p className="text-muted-foreground font-display text-sm mb-4">{s.desc}</p>
                  <span className="text-xs font-display font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    Coming Soon ✨
                  </span>
                </div>
              ) : (
                <Link to={s.to} className="block">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-background/80 flex items-center justify-center">
                      <s.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="font-display text-xl font-bold">{s.emoji} {s.title}</h2>
                  </div>
                  <p className="text-muted-foreground font-display text-sm mb-4">{s.desc}</p>
                  <Button variant="ghost" size="sm" className="rounded-full font-display p-0 text-primary hover:bg-transparent">
                    Explore <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
