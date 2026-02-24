import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePresence, OnlineUser } from "@/hooks/usePresence";

const MAX_VISIBLE = 8;

const OnlineFamilyWidget = ({ onAvatarClick }: { onAvatarClick?: (userId: string) => void }) => {
  const onlineUsers = usePresence();
  const visibleUsers = onlineUsers.slice(0, MAX_VISIBLE);
  const extraCount = onlineUsers.length - MAX_VISIBLE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="mb-8"
    >
      <Card className="rounded-2xl border-2">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <MessageCircle className="h-6 w-6 text-primary" />
          <CardTitle className="font-display text-xl">💬 Family Online Now</CardTitle>
        </CardHeader>
        <CardContent>
          {onlineUsers.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground font-display text-sm mb-3">
                No one is online right now 😴
              </p>
              <Button asChild size="sm" className="rounded-full font-display">
                <Link to="/chat">Open Chat 💬</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                {visibleUsers.map((u) => (
                  <OnlineAvatar key={u.user_id} user={u} onClick={onAvatarClick} />
                ))}
                {extraCount > 0 && (
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-display font-semibold text-muted-foreground">
                    +{extraCount}
                  </div>
                )}
              </div>
              <Button asChild size="sm" variant="outline" className="rounded-full font-display w-fit">
                <Link to="/chat">Open Chat 💬</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const OnlineAvatar = ({
  user,
  onClick,
}: {
  user: OnlineUser;
  onClick?: (userId: string) => void;
}) => {
  const initials = user.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "?";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => onClick?.(user.user_id)}
          className="relative focus:outline-none"
        >
          {/* Pulsing ring */}
          <span className="absolute inset-0 rounded-full animate-pulse-ring" />
          <Avatar className="h-12 w-12 border-2 border-background relative z-10">
            <AvatarImage src={user.avatar_url || ""} alt={user.full_name} />
            <AvatarFallback className="text-xs font-display">{initials}</AvatarFallback>
          </Avatar>
          {/* Green status dot */}
          <span className="absolute bottom-0 right-0 z-20 h-3.5 w-3.5 rounded-full bg-warm-green border-2 border-background" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-display text-sm">{user.full_name} • Online</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default OnlineFamilyWidget;
