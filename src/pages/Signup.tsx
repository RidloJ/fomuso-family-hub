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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !username.trim() || !dob) {
      toast({ title: "Missing info 😅", description: "All fields are required.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/dashboard`,
        data: {
          full_name: fullName,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          username: username.trim(),
          date_of_birth: dob,
        },
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="font-display">First Name *</Label>
                  <Input id="firstName" className="rounded-xl" placeholder="e.g. John" value={firstName} onChange={e => setFirstName(e.target.value)} required maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="font-display">Last Name *</Label>
                  <Input id="lastName" className="rounded-xl" placeholder="e.g. Fomuso" value={lastName} onChange={e => setLastName(e.target.value)} required maxLength={100} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="font-display">Username 😊 *</Label>
                <Input id="username" className="rounded-xl" placeholder="What should we call you?" value={username} onChange={e => setUsername(e.target.value)} required maxLength={50} />
                <p className="text-xs text-muted-foreground">This is how we'll greet you in the app</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob" className="font-display">Date of Birth 🎂 *</Label>
                <Input id="dob" type="date" className="rounded-xl" value={dob} onChange={e => setDob(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-display">Email 📧 *</Label>
                <Input id="email" type="email" className="rounded-xl" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-display">Password 🔑 *</Label>
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
