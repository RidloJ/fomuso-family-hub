import { Link, useLocation } from "react-router-dom";
import { Heart, LogOut, Camera, Home, Calendar, Users, PiggyBank, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/dashboard", label: "Home", icon: Home, emoji: "🏠" },
  { to: "/gallery", label: "Gallery", icon: Camera, emoji: "📸" },
  { to: "/events", label: "Events", icon: Calendar, emoji: "🎉" },
  { to: "/family", label: "Family", icon: Users, emoji: "👨‍👩‍👧‍👦" },
  { to: "/njangi", label: "Njangi", icon: PiggyBank, emoji: "💰" },
  { to: "/chat", label: "Chat", icon: MessageCircle, emoji: "💬" },
];

const AppNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile-nav", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : "?";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isSettingsActive = location.pathname === "/settings";

  return (
    <>
      {/* Desktop top nav */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-6xl mx-auto border-b-2 border-border">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <Heart className="h-6 w-6 sm:h-7 sm:w-7 text-primary fill-primary" />
            </motion.div>
            <span className="font-display text-lg sm:text-xl font-bold">Fomuso Family 🏠</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.to}
                variant={location.pathname === item.to ? "default" : "ghost"}
                size="sm"
                asChild
                className="rounded-full font-display"
              >
                <Link to={item.to}>
                  {item.emoji} {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <Link
            to="/settings"
            className={`rounded-full ring-2 transition-all ${isSettingsActive ? "ring-primary" : "ring-transparent hover:ring-border"}`}
          >
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
              <AvatarImage src={profile?.avatar_url || ""} alt="Profile" />
              <AvatarFallback className="text-xs font-display bg-muted">{initials}</AvatarFallback>
            </Avatar>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-full font-display text-xs sm:text-sm">
            <LogOut className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Bye 👋</span><span className="sm:hidden">👋</span>
          </Button>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t-2 border-border px-2 py-1 safe-area-bottom">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 py-2 px-1.5 rounded-xl transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                <span className="text-[10px] font-display font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default AppNav;
