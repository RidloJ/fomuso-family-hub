import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Camera, Calendar, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Camera, title: "Family Gallery", desc: "Share photos & videos of your favorite moments" },
  { icon: Calendar, title: "Events & Meetings", desc: "Stay in sync with family gatherings" },
  { icon: TrendingUp, title: "Projects & Goals", desc: "Track contributions and family projects" },
  { icon: Users, title: "Stay Connected", desc: "A private space just for your family" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary fill-primary" />
          <span className="font-display text-xl font-bold text-foreground">Fomuso Family</span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link to="/signup">Join the Fomusos</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-24 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
            The Fomuso Family <span className="text-primary">Hub</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Our warm, private space to share memories, plan events,
            track family projects, and stay connected — no matter the distance.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild className="text-base px-8">
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              className="bg-card rounded-xl p-6 border border-border shadow-sm text-center"
            >
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="px-6 pb-24 max-w-3xl mx-auto text-center">
        <h2 className="font-display text-3xl font-bold mb-4">About the Fomusos</h2>
        <p className="text-muted-foreground leading-relaxed">
          The Fomuso Family Hub is our private digital home — a place where every photo, every milestone,
          and every family project lives together. Built with love for our family to stay
          close, organized, and celebrate life's moments as one.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2">
          <Heart className="h-4 w-4 text-primary fill-primary" />
          <span>Fomuso Family Hub — Made with love</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
