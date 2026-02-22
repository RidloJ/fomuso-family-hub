import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Camera, Calendar, TrendingUp, Users, ArrowRight, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Camera, title: "📸 Family Gallery", desc: "Share photos & videos organized by each family branch." },
  { icon: Calendar, title: "🎉 Events & Meetings", desc: "Plan gatherings, RSVP, and never miss a celebration." },
  { icon: TrendingUp, title: "🚀 Family Projects", desc: "Track contributions and progress toward shared goals." },
  { icon: Users, title: "💬 Stay Connected", desc: "Post updates and announcements for the whole family." },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* ─── Nav ─── */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary fill-primary" />
          <span className="font-display text-xl font-semibold text-foreground tracking-tight">
            Fomuso Family
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-8 font-display text-sm tracking-wide">
          <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
        </div>
        <Button asChild className="rounded-full font-display shadow-lg sm:hidden">
          <Link to="/login">Sign In</Link>
        </Button>
      </nav>

      {/* ─── Hero ─── */}
      <section className="text-center px-6 pt-24 pb-16 max-w-3xl mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <motion.div
            className="text-7xl md:text-8xl mb-6"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            🏡
          </motion.div>
          <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground leading-[1.1] tracking-tight mb-4">
            The Fomuso Family<br />
            <span className="text-primary">Hub</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto mb-10 font-body leading-relaxed">
            Our private corner of the internet — where we share memories, plan adventures, and stay close no matter the distance 💕
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                asChild
                size="lg"
                className="rounded-full px-10 py-6 text-lg font-display font-bold shadow-2xl"
              >
                <Link to="/signup">Join the Family 🎉</Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full px-10 py-6 text-lg font-display font-bold"
              >
                <Link to="/login">Sign In ✨</Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ─── Private Badge ─── */}
      <section className="max-w-2xl mx-auto px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-4 bg-card rounded-2xl border-2 border-border p-5 shadow-sm"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Private & Secure 🔒</h3>
            <p className="text-sm text-muted-foreground">
              All photos, events, and family content are only visible to registered and approved family members.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ─── About ─── */}
      <section id="about" className="bg-card/50 py-20">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Hey There, We're the Fomusos! 👋
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg max-w-2xl mx-auto mb-8">
              Our family hub is all about slowing down, enjoying each other's company,
              and capturing the beautiful moments that make us who we are.
              Whether it's a big birthday bash 🎂 or a quiet Sunday afternoon ☀️,
              this is where we keep our memories alive forever.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground font-display">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Members Only</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary fill-primary" />
                <span>5 Family Branches</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="max-w-5xl mx-auto px-8 py-20">
        <motion.h2
          className="font-display text-3xl md:text-4xl font-bold text-center mb-12 text-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          What's Inside Our Hub? 🤔
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", bounce: 0.3 }}
              whileHover={{ y: -6 }}
              className="bg-card rounded-2xl p-6 border-2 border-border shadow-sm text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                <f.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2 text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Quote ─── */}
      <section className="bg-card/50 py-20">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-5xl mb-6">💖</div>
            <blockquote className="text-xl md:text-2xl font-display text-foreground leading-relaxed italic mb-6">
              "Family is not an important thing. It's everything. This hub keeps us close no matter where life takes us."
            </blockquote>
            <p className="font-display text-muted-foreground font-semibold">— The Fomuso Family</p>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border py-10 text-center">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-primary fill-primary" />
            <span className="font-display text-lg font-semibold text-foreground">Fomuso Family Hub</span>
          </div>
          <p className="text-sm text-muted-foreground font-display">
            Made with love & lots of fun! ✨ © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
