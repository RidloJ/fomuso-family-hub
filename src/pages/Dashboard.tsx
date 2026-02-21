import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, LogOut } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto border-b border-border">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary fill-primary" />
          <span className="font-display text-xl font-bold">Fomuso Family</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-12 text-center">
        <h1 className="font-display text-3xl font-bold mb-4">Welcome Home, {user.user_metadata?.full_name || "Family Member"} 🏠</h1>
        <p className="text-muted-foreground">Your family dashboard is being built. More features coming soon!</p>
      </main>
    </div>
  );
};

export default Dashboard;
