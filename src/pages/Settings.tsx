import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppNav from "@/components/AppNav";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Camera, Lock, Moon, Sun, Bell, User, Eye, EyeOff, Volume2, BellRing, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  requestNotificationPermission,
  isSoundEnabled,
  isPushEnabled,
  setSoundEnabled,
  setPushEnabled,
} from "@/hooks/useNotifications";

const Settings = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [pushOn, setPushOn] = useState(() => isPushEnabled());

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editUsername, setEditUsername] = useState("");

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

  // Notification preferences from DB
  const { data: notifPrefs } = useQuery({
    queryKey: ["notification-prefs", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [notifications, setNotifications] = useState({ events: true, gallery: true, njangi: true });

  // Sync DB prefs to local state
  useEffect(() => {
    if (notifPrefs) {
      setNotifications({
        events: (notifPrefs as any).events ?? true,
        gallery: (notifPrefs as any).gallery ?? true,
        njangi: (notifPrefs as any).njangi ?? true,
      });
    }
  }, [notifPrefs]);

  // Sync profile to edit fields
  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name || "");
      setEditBio((profile as any).bio || "");
      setEditUsername((profile as any).username || "");
    }
  }, [profile]);

  const updateNotifPref = async (key: string, value: boolean) => {
    if (!user) return;
    const newPrefs = { ...notifications, [key]: value };
    setNotifications(newPrefs);

    // Upsert
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: user.id,
        ...newPrefs,
      } as any, { onConflict: "user_id" });
    if (error) toast.error("Failed to save preference");
  };

  const updateProfile = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editName.trim(),
          bio: editBio.trim() || null,
          username: editUsername.trim() || null,
        } as any)
        .eq("user_id", user.id);
      if (error) throw error;
      // Also update auth metadata
      await supabase.auth.updateUser({
        data: { full_name: editName.trim(), username: editUsername.trim() },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      setEditingProfile(false);
      toast.success("Profile updated! ✅");
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not authenticated");
      const ext = file.name.split(".").pop();
      const filePath = `avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("gallery").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(filePath);
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("user_id", user.id);
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
      if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
      uploadAvatarMutation.mutate(file);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) { toast.error(error.message); } else {
      toast.success("Password updated! 🔒");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const toggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) { document.documentElement.classList.add("dark"); localStorage.setItem("theme", "dark"); }
    else { document.documentElement.classList.remove("dark"); localStorage.setItem("theme", "light"); }
  };

  if (loading || profileLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="font-display text-lg">Loading... ⏳</p></div>;
  }

  const initials = profile?.full_name ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "?";

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="font-display text-2xl font-bold">Settings ⚙️</h1>

        {/* Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2"><User className="h-5 w-5" /> Profile</CardTitle>
              <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setEditingProfile(!editingProfile)}>
                <Pencil className="h-4 w-4 mr-1" /> {editingProfile ? "Cancel" : "Edit"}
              </Button>
            </div>
            <CardDescription>Your profile picture, name, and bio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
                <Avatar className="h-20 w-20 border-2 border-border">
                  <AvatarImage src={profile?.avatar_url || ""} alt="Profile" />
                  <AvatarFallback className="text-xl font-display">{initials}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-foreground/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-primary-foreground" />
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
              <div>
                <p className="font-display font-semibold text-lg">{profile?.full_name || "Family Member"}</p>
                {(profile as any)?.username && <p className="text-sm text-muted-foreground">@{(profile as any).username}</p>}
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            {editingProfile && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="space-y-2">
                  <Label className="font-display">Display Name</Label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-xl" maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label className="font-display">Username</Label>
                  <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="rounded-xl" placeholder="How we greet you" maxLength={50} />
                </div>
                <div className="space-y-2">
                  <Label className="font-display">Bio</Label>
                  <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="rounded-xl" placeholder="Tell the family about yourself..." maxLength={500} />
                </div>
                <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending} className="rounded-full font-display">
                  {updateProfile.isPending ? "Saving..." : "Save Profile ✅"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2"><Lock className="h-5 w-5" /> Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input id="new-password" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="pr-10" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="pr-10" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button onClick={handlePasswordChange} disabled={changingPassword || !newPassword} className="rounded-full font-display">
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
            <CardTitle className="font-display flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle>
            <CardDescription>Choose what you want to be notified about</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-display">Chat Sound Alerts 🔔</span>
              </div>
              <Switch checked={soundOn} onCheckedChange={(v) => { setSoundOn(v); setSoundEnabled(v); toast.success(v ? "Sound alerts enabled" : "Sound alerts disabled"); }} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-muted-foreground" />
                <span className="font-display">Push Notifications 📲</span>
              </div>
              <Switch checked={pushOn} onCheckedChange={async (v) => {
                if (v) { const granted = await requestNotificationPermission(); if (!granted) { toast.error("Notification permission denied."); return; } }
                setPushOn(v); setPushEnabled(v); toast.success(v ? "Push notifications enabled" : "Push notifications disabled");
              }} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-display">Event Reminders 🎉</span>
              <Switch checked={notifications.events} onCheckedChange={(v) => updateNotifPref("events", v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-display">Gallery Activity 📸</span>
              <Switch checked={notifications.gallery} onCheckedChange={(v) => updateNotifPref("gallery", v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-display">Njangi Updates 💰</span>
              <Switch checked={notifications.njangi} onCheckedChange={(v) => updateNotifPref("njangi", v)} />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
