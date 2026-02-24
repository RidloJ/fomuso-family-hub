import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppNav from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users, Calendar, Search } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const FamilyMembers = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [father, setFather] = useState("");
  const [mother, setMother] = useState("");
  const [search, setSearch] = useState("");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["family-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .order("last_name", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addMember = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("family_members").insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: dob,
        father: father.trim() || null,
        mother: mother.trim() || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-members"] });
      toast({ title: "Member added! 🎉", description: `${firstName} ${lastName} has been registered.` });
      resetForm();
      setDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setDob("");
    setFather("");
    setMother("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !dob) {
      toast({ title: "Missing info", description: "First name, last name, and date of birth are required.", variant: "destructive" });
      return;
    }
    addMember.mutate();
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading... ⏳</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNav />
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8 pb-24 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Users className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              <h1 className="font-display text-2xl sm:text-3xl font-bold">Family Registry 👨‍👩‍👧‍👦</h1>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full font-display">
                  <UserPlus className="h-4 w-4 mr-2" /> Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">Register New Family Member 🆕</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-display">First Name *</Label>
                      <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. John" required className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-display">Last Name *</Label>
                      <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Fomuso" required className="rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-display">Date of Birth *</Label>
                    <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-display">Father</Label>
                      <Input value={father} onChange={(e) => setFather(e.target.value)} placeholder="Father's name" className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-display">Mother</Label>
                      <Input value={mother} onChange={(e) => setMother(e.target.value)} placeholder="Mother's name" className="rounded-xl" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full rounded-full font-display" disabled={addMember.isPending}>
                    {addMember.isPending ? "Registering... ⏳" : "Register Member ✅"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground py-12">Loading members... ⏳</p>
          ) : members.length === 0 ? (
            <Card className="rounded-3xl border-2 text-center py-16">
              <CardContent>
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="font-display text-xl mb-2">No members registered yet</h2>
                <p className="text-muted-foreground mb-4">Start building the family tree by adding the first member!</p>
                <Button className="rounded-full font-display" onClick={() => setDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" /> Add First Member
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-3xl border-2 overflow-hidden">
              <CardHeader className="space-y-4">
                <CardTitle className="font-display text-lg">
                  {members.length} Family Member{members.length !== 1 ? "s" : ""} Registered
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, parent..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 rounded-xl"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-display">First Name</TableHead>
                        <TableHead className="font-display">Last Name</TableHead>
                        <TableHead className="font-display">Date of Birth</TableHead>
                        <TableHead className="font-display">Father</TableHead>
                        <TableHead className="font-display">Mother</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members
                        .filter((m: any) => {
                          if (!search.trim()) return true;
                          const q = search.toLowerCase();
                          return (
                            m.first_name.toLowerCase().includes(q) ||
                            m.last_name.toLowerCase().includes(q) ||
                            (m.father && m.father.toLowerCase().includes(q)) ||
                            (m.mother && m.mother.toLowerCase().includes(q))
                          );
                        })
                        .map((member: any) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.first_name}</TableCell>
                          <TableCell>{member.last_name}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              {format(new Date(member.date_of_birth), "dd MMM yyyy")}
                            </span>
                          </TableCell>
                          <TableCell>{member.father || "—"}</TableCell>
                          <TableCell>{member.mother || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default FamilyMembers;
