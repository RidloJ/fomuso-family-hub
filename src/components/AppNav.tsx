import { Link, useLocation } from "react-router-dom";
import { Heart, LogOut, Camera, Home, Calendar, Users, PiggyBank } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Home", icon: Home, emoji: "🏠" },
  { to: "/gallery", label: "Gallery", icon: Camera, emoji: "📸" },
  { to: "/events", label: "Events", icon: Calendar, emoji: "🎉" },
  { to: "/family", label: "Family", icon: Users, emoji: "👨‍👩‍👧‍👦" },
  { to: "/njangi", label: "Njangi", icon: PiggyBank, emoji: "💰" },
];

const AppNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto border-b-2 border-border">
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Heart className="h-7 w-7 text-primary fill-primary" />
          </motion.div>
          <span className="font-display text-xl font-bold">Fomuso Family 🏠</span>
        </Link>
        <div className="hidden sm:flex items-center gap-1">
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
      <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-full font-display">
        <LogOut className="h-4 w-4 mr-2" /> Bye 👋
      </Button>
    </nav>
  );
};

export default AppNav;
