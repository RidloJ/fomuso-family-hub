import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppNav from "@/components/AppNav";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Shield, Users, UserCheck, UserX, Crown } from "lucide-react";
import { toast } from "sonner";

const Admin = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();
      return !!data;
    },
    enabled: !!user,
  });

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!isAdmin,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*");
      if (error) throw error;
      return data || [];
    },
    enabled: !!isAdmin,
  });

  const toggleApproval = async (profileId: string, currentlyApproved: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: !currentlyApproved })
      .eq("id", profileId);
    if (error) {
      toast.error("Failed to update approval");
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast.success(currentlyApproved ? "Member access revoked" : "Member approved ✅");
    }
  };

  const toggleAdminRole = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (isCurrentlyAdmin) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");
      if (error) {
        toast.error("Failed to remove admin role");
      } else {
        queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
        toast.success("Admin role removed");
      }
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });
      if (error) {
        toast.error("Failed to grant admin role");
      } else {
        queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
        toast.success("Admin role granted 👑");
      }
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-display text-lg">Loading... ⏳</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Shield className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Access Denied 🔒</h1>
          <p className="text-muted-foreground font-display">
            You don't have admin privileges to access this page.
          </p>
        </main>
      </div>
    );
  }

  const approvedCount = profiles.filter((p) => p.is_approved).length;
  const pendingCount = profiles.filter((p) => !p.is_approved).length;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <AppNav />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Admin Panel 👑</h1>
          <p className="text-muted-foreground font-display text-sm">Manage family members, roles, and access.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="rounded-xl border-2">
            <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="font-display text-2xl font-bold">{profiles.length}</p>
                <p className="text-xs text-muted-foreground font-display">Total Members</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-2">
            <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-warm-green" />
              <div>
                <p className="font-display text-2xl font-bold">{approvedCount}</p>
                <p className="text-xs text-muted-foreground font-display">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-2">
            <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
              <UserX className="h-8 w-8 text-warm-orange" />
              <div>
                <p className="font-display text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground font-display">Pending</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Members list */}
        <Card className="rounded-2xl border-2">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Users className="h-5 w-5" /> Family Members
            </CardTitle>
            <CardDescription>Approve members and manage roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profilesLoading ? (
              <p className="text-muted-foreground text-sm font-display">Loading...</p>
            ) : profiles.length === 0 ? (
              <p className="text-muted-foreground text-sm font-display">No members yet.</p>
            ) : (
              profiles.map((profile) => {
                const userRole = roles.find((r) => r.user_id === profile.user_id);
                const isProfileAdmin = userRole?.role === "admin";
                const initials = profile.full_name
                  ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
                  : "?";
                const isSelf = profile.user_id === user?.id;

                return (
                  <div
                    key={profile.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar_url || ""} />
                      <AvatarFallback className="text-xs font-display">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-display font-semibold text-sm truncate">
                          {profile.full_name || "Unnamed"}
                        </p>
                        {isProfileAdmin && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">
                            <Crown className="h-2.5 w-2.5 mr-0.5" /> Admin
                          </Badge>
                        )}
                        {isSelf && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">You</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{profile.user_id}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex flex-col items-center gap-0.5">
                        <Switch
                          checked={profile.is_approved}
                          onCheckedChange={() => toggleApproval(profile.id, profile.is_approved)}
                          aria-label="Toggle approval"
                        />
                        <span className="text-[9px] text-muted-foreground font-display">
                          {profile.is_approved ? "Approved" : "Pending"}
                        </span>
                      </div>
                      {!isSelf && (
                        <div className="flex flex-col items-center gap-0.5">
                          <Switch
                            checked={isProfileAdmin}
                            onCheckedChange={() => toggleAdminRole(profile.user_id, isProfileAdmin)}
                            aria-label="Toggle admin"
                          />
                          <span className="text-[9px] text-muted-foreground font-display">Admin</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
