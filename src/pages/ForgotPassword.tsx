import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Oops! 😅", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
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
            <CardTitle className="font-display text-2xl">Forgot Password? 🔐</CardTitle>
            <CardDescription>
              {sent ? "Check your email for a reset link! 📬" : "No worries, we'll send you a reset link ✨"}
            </CardDescription>
          </CardHeader>
          {sent ? (
            <CardFooter className="flex-col gap-4">
              <p className="text-sm text-muted-foreground text-center">
                We sent a password reset link to <strong>{email}</strong>. Check your inbox (and spam folder)!
              </p>
              <Link to="/login" className="w-full">
                <Button variant="outline" className="w-full rounded-full font-display">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Button>
              </Link>
            </CardFooter>
          ) : (
            <form onSubmit={handleReset}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-display">Email 📧</Label>
                  <Input id="email" type="email" className="rounded-xl" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                  <Button type="submit" className="w-full rounded-full font-display text-base shadow-md" disabled={loading}>
                    {loading ? "Sending... ⏳" : "Send Reset Link 📩"}
                  </Button>
                </motion.div>
                <Link to="/login" className="text-sm text-primary hover:underline font-display font-semibold">
                  <ArrowLeft className="inline mr-1 h-3 w-3" />Back to Login
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
