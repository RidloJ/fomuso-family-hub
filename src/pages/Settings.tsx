import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppNav from "@/components/AppNav";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Camera, Lock, Moon, Sun, Bell, User } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    events: true,
    gallery: true,
    njangi: true,
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not authenticated");
      const ext = file.name.split(".").pop();
      const filePath = `avatars/${user.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("gallery")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Profile picture updated! 📸");
    },
    onError: () => toast.error("Failed to upload picture"),
  });

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5MB");
        return;
      }
      uploadAvatarMutation.mutate(file);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated! 🔒");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const toggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-display text-lg">Loading... ⏳</p>
      </div>
    );
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : "?";

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="font-display text-2xl font-bold">Settings ⚙️</h1>

        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <User className="h-5 w-5" /> Profile Picture
            </CardTitle>
            <CardDescription>Click the avatar to upload a new photo</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={profile?.avatar_url || ""} alt="Profile" />
                <AvatarFallback className="text-xl font-display">{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-foreground/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-primary-foreground" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div>
              <p className="font-display font-semibold text-lg">{profile?.full_name || "Family Member"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Lock className="h-5 w-5" /> Change Password
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={changingPassword || !newPassword}
              className="rounded-full font-display"
            >
              {changingPassword ? "Updating..." : "Update Password 🔒"}
            </Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />} Appearance
            </CardTitle>
            <CardDescription>Choose your preferred theme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <span className="font-display">Dark Mode</span>
                <Moon className="h-4 w-4 text-muted-foreground" />
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Bell className="h-5 w-5" /> Notifications
            </CardTitle>
            <CardDescription>Choose what you want to be notified about</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-display">Event Reminders 🎉</span>
              <Switch
                checked={notifications.events}
                onCheckedChange={(v) => setNotifications((n) => ({ ...n, events: v }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-display">Gallery Activity 📸</span>
              <Switch
                checked={notifications.gallery}
                onCheckedChange={(v) => setNotifications((n) => ({ ...n, gallery: v }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-display">Njangi Updates 💰</span>
              <Switch
                checked={notifications.njangi}
                onCheckedChange={(v) => setNotifications((n) => ({ ...n, njangi: v }))}
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
