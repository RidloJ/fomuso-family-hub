import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Camera, Calendar, TrendingUp, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroFamily1 from "@/assets/hero-family-1.jpg";
import heroFamily2 from "@/assets/hero-family-2.jpg";
import heroFamily3 from "@/assets/hero-family-3.jpg";
import heroFamily4 from "@/assets/hero-family-4.jpg";

const features = [
  { icon: Camera, title: "📸 Family Gallery", desc: "Share awesome photos & videos of our best moments!" },
  { icon: Calendar, title: "🎉 Events & Parties", desc: "Never miss a birthday, BBQ, or family game night!" },
  { icon: TrendingUp, title: "🚀 Family Projects", desc: "Work together on cool goals and track our progress!" },
  { icon: Users, title: "💬 Stay Connected", desc: "Our own private space to chat and share updates!" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* ─── Minimal Nav ─── */}
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

      {/* ─── Hero Section ─── */}
      <section className="text-center px-6 pt-16 pb-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground leading-[1.1] tracking-tight mb-6">
            The Fomuso Family<br />
            <span className="text-primary">Hub</span> 🏡
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 font-body leading-relaxed">
            Our cozy corner of the internet — where we share memories, plan adventures, and stay close no matter the distance 💕
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              asChild
              size="lg"
              className="rounded-full h-20 w-20 md:h-24 md:w-24 text-base font-display shadow-xl hover:shadow-2xl transition-shadow"
            >
              <Link to="/signup" className="flex flex-col items-center leading-tight">
                <span className="text-xs md:text-sm">Join</span>
                <span className="text-xs md:text-sm">Us! 🎉</span>
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Photo Strip ─── */}
      <section className="py-8">
        <div className="flex gap-3 md:gap-4 px-0 overflow-hidden">
          {[heroFamily2, heroFamily3, heroFamily1, heroFamily4].map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
              className={`flex-1 ${i === 2 ? 'flex-[1.5]' : ''}`}
            >
              <img
                src={src}
                alt={`Family moment ${i + 1}`}
                className="w-full h-[300px] md:h-[500px] object-cover"
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── About Section ─── */}
      <section id="about" className="max-w-6xl mx-auto px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <img
              src={heroFamily4}
              alt="The Fomuso Family"
              className="rounded-2xl shadow-lg w-72 h-80 object-cover mx-auto md:mx-0"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Hey There, We're the Fomusos! 👋
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg mb-6">
              Our family hub is all about slowing down, enjoying each other's company,
              and capturing the beautiful moments that make us who we are.
              Whether it's a big birthday bash 🎂 or a quiet Sunday afternoon ☀️,
              this is where we keep our memories alive forever.
            </p>
            <Button variant="outline" asChild className="rounded-full font-display">
              <Link to="/signup">
                Learn More <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>


      {/* ─── Features / What We Do ─── */}
      <section id="features" className="max-w-5xl mx-auto px-8 py-20">
        <motion.h2
          className="font-display text-3xl md:text-4xl font-bold text-center mb-12"
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
              <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Testimonial / Quote ─── */}
      <section className="bg-muted/50 py-20">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <img
              src={heroFamily1}
              alt="Family"
              className="w-32 h-20 object-cover rounded-lg mx-auto mb-8 shadow-md"
            />
            <blockquote className="text-xl md:text-2xl font-display text-foreground leading-relaxed italic mb-6">
              "Family is not an important thing. It's everything. 💖 This hub keeps us close no matter where life takes us."
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
            <span className="font-display text-lg font-semibold">Fomuso Family Hub</span>
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
