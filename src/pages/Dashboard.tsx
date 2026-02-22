import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/login");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user) return null;

  const name = user.user_metadata?.full_name || "Family Member";

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto border-b-2 border-border">
        <div className="flex items-center gap-2">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Heart className="h-7 w-7 text-primary fill-primary" />
          </motion.div>
          <span className="font-display text-xl font-bold">Fomuso Family 🏠</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-full font-display">
          <LogOut className="h-4 w-4 mr-2" /> Bye for now 👋
        </Button>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
        >
          <motion.div
            className="text-6xl mb-4"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            🎉
          </motion.div>
          <h1 className="font-display text-4xl font-bold mb-4">
            Hey there, {name}! 🌟
          </h1>
          <p className="text-lg text-muted-foreground font-display">
            Your family dashboard is getting ready... More fun features coming soon! 🚀✨
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
