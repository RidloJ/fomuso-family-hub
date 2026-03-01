import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const PendingApproval = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="rounded-3xl border-2 shadow-xl text-center">
          <CardHeader className="pb-2">
            <div className="text-5xl mb-2">⏳</div>
            <CardTitle className="font-display text-2xl">Awaiting Approval</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground font-display">
              Your account has been created, but a family admin needs to approve you before you can access the app. Please check back later!
            </p>
            <Button variant="outline" onClick={handleLogout} className="rounded-full font-display">
              Log Out 👋
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PendingApproval;
