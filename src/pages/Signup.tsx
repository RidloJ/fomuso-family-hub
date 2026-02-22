import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Oops! 😅", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Almost there! 📬",
        description: "Check your email for a confirmation link. After that, a family admin will approve you!",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="rounded-3xl border-2 shadow-lg">
          <CardHeader className="text-center">
            <Link to="/" className="flex items-center justify-center gap-2 mb-4">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Heart className="h-7 w-7 text-primary fill-primary" />
              </motion.div>
              <span className="font-display text-xl font-bold">Fomuso Family 🏠</span>
            </Link>
            <CardTitle className="font-display text-2xl">Join the Fomuso Family! 🎊</CardTitle>
            <CardDescription>Create your account to be part of the fun ✨</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-display">Your Name 😊</Label>
                <Input id="name" className="rounded-xl" placeholder="What should we call you?" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-display">Email 📧</Label>
                <Input id="email" type="email" className="rounded-xl" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-display">Password 🔑</Label>
                <Input id="password" type="password" className="rounded-xl" placeholder="Make it super secret!" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                <Button type="submit" className="w-full rounded-full font-display text-base shadow-md" disabled={loading}>
                  {loading ? "Creating your account... ⏳" : "Sign Me Up! 🎉"}
                </Button>
              </motion.div>
              <p className="text-sm text-muted-foreground">
                Already in the family?{" "}
                <Link to="/login" className="text-primary hover:underline font-display font-semibold">Sign in! 👋</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default Signup;
