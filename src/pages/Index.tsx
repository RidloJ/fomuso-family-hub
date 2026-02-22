import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Camera, Calendar, TrendingUp, Users, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Camera, title: "📸 Family Gallery", desc: "Share awesome photos & videos of our best moments!", color: "bg-fun-purple/20" },
  { icon: Calendar, title: "🎉 Events & Parties", desc: "Never miss a birthday, BBQ, or family game night!", color: "bg-fun-blue/20" },
  { icon: TrendingUp, title: "🚀 Family Projects", desc: "Work together on cool goals and track our progress!", color: "bg-warm-orange/20" },
  { icon: Users, title: "💬 Stay Connected", desc: "Our own private space to chat and share updates!", color: "bg-warm-green/20" },
];

const floatingEmojis = ["🌟", "💖", "🎈", "🦋", "🌈", "✨"];

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Floating decorative emojis */}
      {floatingEmojis.map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl md:text-3xl pointer-events-none select-none"
          style={{
            left: `${10 + i * 15}%`,
            top: `${5 + (i % 3) * 8}%`,
          }}
          animate={{
            y: [0, -15, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        >
          {emoji}
        </motion.div>
      ))}

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto relative z-10">
        <div className="flex items-center gap-2">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Heart className="h-7 w-7 text-primary fill-primary" />
          </motion.div>
          <span className="font-display text-2xl font-bold text-foreground">Fomuso Family 🏠</span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" asChild className="rounded-full font-display">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild className="rounded-full font-display shadow-lg hover:shadow-xl transition-shadow">
            <Link to="/signup">Join Us! 🎉</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-12 pb-20 max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, type: "spring", bounce: 0.4 }}
        >
          <motion.div
            className="text-6xl md:text-7xl mb-4"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            🏡
          </motion.div>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
            Welcome to the{" "}
            <span className="text-primary relative">
              Fomuso Family
              <motion.span
                className="absolute -top-2 -right-6"
                animate={{ rotate: [0, 20, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles className="h-6 w-6 text-warm-orange" />
              </motion.span>
            </span>{" "}
            Hub! 🎊
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Our super fun, cozy corner of the internet where we share memories 📸,
            plan awesome events 🎈, work on cool projects together 🚀,
            and stay close no matter where we are! 💕
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" asChild className="text-base px-8 rounded-full shadow-lg font-display text-lg">
                <Link to="/signup">Let's Go! 🚀</Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" variant="outline" asChild className="text-base px-8 rounded-full font-display text-lg">
                <Link to="/login">I'm Already In ✨</Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20 max-w-5xl mx-auto relative z-10">
        <motion.h2
          className="font-display text-3xl font-bold text-center mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          What Can We Do Here? 🤔
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.5, type: "spring", bounce: 0.3 }}
              whileHover={{ y: -8, scale: 1.03 }}
              className="bg-card rounded-2xl p-6 border-2 border-border shadow-md text-center cursor-default"
            >
              <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center mx-auto mb-4`}>
                <f.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-3xl p-8 border-2 border-border shadow-md"
        >
          <h2 className="font-display text-3xl font-bold mb-4">About the Fomusos 💖</h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            The Fomuso Family Hub is our own little digital home 🏠 — a place where every photo 📸,
            every milestone 🏆, and every family project lives together. Built with lots of love ❤️
            for our amazing family to stay close, have fun, and celebrate life's awesome moments
            together! 🎉
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-border py-8 text-center text-sm text-muted-foreground relative z-10">
        <div className="flex items-center justify-center gap-2">
          <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <Heart className="h-4 w-4 text-primary fill-primary" />
          </motion.div>
          <span className="font-display">Fomuso Family Hub — Made with love & fun! ✨</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
