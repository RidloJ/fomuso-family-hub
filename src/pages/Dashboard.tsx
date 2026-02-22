import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import AppNav from "@/components/AppNav";

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  const name = user.user_metadata?.full_name || "Family Member";

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
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
