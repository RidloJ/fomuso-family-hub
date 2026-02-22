import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Camera, Calendar, TrendingUp, Users, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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

const carouselImages = [
  { src: heroFamily1, caption: "Family Moments 🥰" },
  { src: heroFamily2, caption: "Together Forever 💕" },
  { src: heroFamily3, caption: "Making Memories ✨" },
  { src: heroFamily4, caption: "Our Happy Place 🏡" },
];

const FamilyCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % carouselImages.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next]);

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0, scale: 0.95 }),
  };

  return (
    <section className="py-10 max-w-5xl mx-auto px-6">
      <div className="relative rounded-3xl overflow-hidden shadow-xl border-2 border-border bg-muted">
        <div className="aspect-[16/9] md:aspect-[21/9] relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.img
              key={current}
              src={carouselImages[current].src}
              alt={carouselImages[current].caption}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>

          {/* Caption overlay */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 md:p-8"
            >
              <p className="font-display text-xl md:text-2xl font-bold text-white drop-shadow-lg">
                {carouselImages[current].caption}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Nav buttons */}
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 rounded-full p-2 shadow-md transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 rounded-full p-2 shadow-md transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 py-3">
          {carouselImages.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === current ? "bg-primary scale-125" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

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
      <section className="text-center px-6 pt-20 pb-12 max-w-3xl mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground leading-[1.1] tracking-tight mb-4">
            The Fomuso Family<br />
            <span className="text-primary">Hub</span> 🏡
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto mb-8 font-body leading-relaxed">
            Our cozy corner of the internet — where we share memories, plan adventures, and stay close no matter the distance 💕
          </p>
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            animate={{ boxShadow: ["0 0 0px hsl(var(--primary))", "0 0 25px hsl(var(--primary) / 0.5)", "0 0 0px hsl(var(--primary))"] }}
            transition={{ boxShadow: { duration: 2, repeat: Infinity }, scale: { duration: 0.2 } }}
            className="rounded-full"
          >
            <Button
              asChild
              size="lg"
              className="rounded-full px-10 py-6 text-lg md:text-xl font-display font-bold bg-primary text-primary-foreground shadow-2xl hover:shadow-primary/40 transition-all"
            >
              <Link to="/signup">
                Join Us! 🎉
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Photo Carousel ─── */}
      <FamilyCarousel />

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
