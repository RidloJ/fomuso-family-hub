import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppNav from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users, Calendar, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const MEMBER_TYPES = [
  { value: "grandpa", label: "Grand Father 👴" },
  { value: "grandma", label: "Grand Mother 👵" },
  { value: "children", label: "Child 👨‍👩‍👧" },
  { value: "grandchildren", label: "Grand Child 👶" },
  { value: "wife", label: "Wife 👰" },
  { value: "husband", label: "Husband 🤵" },
] as const;

type MemberType = "grandpa" | "grandma" | "children" | "grandchildren" | "wife" | "husband";

const PARENT_DISABLED_TYPES: MemberType[] = ["grandpa", "grandma"];
const SPOUSE_TYPES: MemberType[] = ["wife", "husband"];

// Tree categories with their types, colors, and emojis
const TREE_CATEGORIES = [
  {
    id: "grandparents",
    label: "Grandparents",
    emoji: "👴👵",
    description: "The roots of our family tree",
    types: ["grandpa", "grandma"] as MemberType[],
    gradient: "from-amber-500/20 to-amber-300/10",
    border: "border-amber-400/50",
    iconBg: "bg-amber-500/20",
    textColor: "text-amber-600",
    size: "p-5 sm:p-6",
    emojiSize: "text-5xl sm:text-6xl",
    titleSize: "text-xl sm:text-2xl",
  },
  {
    id: "children",
    label: "Children & Spouses",
    emoji: "👨‍👩‍👧‍👦",
    description: "The strong branches of our family",
    types: ["children", "wife", "husband"] as MemberType[],
    gradient: "from-fun-blue/20 to-fun-purple/15",
    border: "border-fun-blue/40",
    iconBg: "bg-fun-blue/20",
    textColor: "text-fun-blue",
    size: "p-4 sm:p-5",
    emojiSize: "text-4xl sm:text-5xl",
    titleSize: "text-lg sm:text-xl",
  },
  {
    id: "grandchildren",
    label: "Grandchildren",
    emoji: "👶🌟",
    description: "The beautiful new leaves growing",
    types: ["grandchildren"] as MemberType[],
    gradient: "from-fun-teal/20 to-warm-green/15",
    border: "border-fun-teal/40",
    iconBg: "bg-fun-teal/20",
    textColor: "text-fun-teal",
    size: "p-3 sm:p-4",
    emojiSize: "text-3xl sm:text-4xl",
    titleSize: "text-base sm:text-lg",
  },
];

const FamilyMembers = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [father, setFather] = useState("");
  const [mother, setMother] = useState("");
  const [memberType, setMemberType] = useState<MemberType>("children");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const parentDisabled = PARENT_DISABLED_TYPES.includes(memberType);
  const isSpouseType = SPOUSE_TYPES.includes(memberType);
  const isEditing = !!editingId;

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
        father: parentDisabled ? null : (father.trim() || null),
        mother: (parentDisabled || isSpouseType) ? null : (mother.trim() || null),
        member_type: memberType,
        created_by: user!.id,
      } as any);
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

  const updateMember = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase
        .from("family_members")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          date_of_birth: dob,
          father: parentDisabled ? null : (father.trim() || null),
          mother: (parentDisabled || isSpouseType) ? null : (mother.trim() || null),
          member_type: memberType,
        } as any)
        .eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-members"] });
      toast({ title: "Member updated! ✏️", description: `${firstName} ${lastName} has been updated.` });
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
    setMemberType("children");
    setEditingId(null);
  };

  const handleEdit = (member: any) => {
    setEditingId(member.id);
    setFirstName(member.first_name);
    setLastName(member.last_name);
    setDob(member.date_of_birth);
    setFather(member.father || "");
    setMother(member.mother || "");
    setMemberType(member.member_type || "children");
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !dob) {
      toast({ title: "Missing info", description: "First name, last name, and date of birth are required.", variant: "destructive" });
      return;
    }
    if (isEditing) {
      updateMember.mutate();
    } else {
      addMember.mutate();
    }
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) resetForm();
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading... ⏳</div>;
  }

  const isPending = addMember.isPending || updateMember.isPending;

  const getMembersForCategory = (types: MemberType[]) =>
    members.filter((m: any) => types.includes(m.member_type));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNav />
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 pb-24 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🌳</div>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold">Family Tree</h1>
                <p className="text-sm text-muted-foreground font-display">
                  {members.length} member{members.length !== 1 ? "s" : ""} in our family 💕
                </p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button className="rounded-full font-display shadow-lg">
                  <UserPlus className="h-4 w-4 mr-2" /> Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">
                    {isEditing ? "Edit Family Member ✏️" : "Register New Family Member 🆕"}
                  </DialogTitle>
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
                    <Label className="font-display">Member Type *</Label>
                    <Select value={memberType} onValueChange={(v) => {
                      setMemberType(v as MemberType);
                      if (PARENT_DISABLED_TYPES.includes(v as MemberType)) {
                        setFather("");
                        setMother("");
                      }
                    }}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEMBER_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-display">Date of Birth *</Label>
                    <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required className="rounded-xl" />
                  </div>
                    {isSpouseType ? (
                      <div className="space-y-2">
                        <Label className="font-display">
                          {memberType === "wife" ? "Husband's Name 🤵" : "Wife's Name 👰"}
                        </Label>
                        <Input
                          value={father}
                          onChange={(e) => setFather(e.target.value)}
                          placeholder={memberType === "wife" ? "Husband's name" : "Wife's name"}
                          className="rounded-xl"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className={`font-display ${parentDisabled ? "text-muted-foreground" : ""}`}>Father</Label>
                          <Input value={father} onChange={(e) => setFather(e.target.value)} placeholder="Father's name" className="rounded-xl" disabled={parentDisabled} />
                        </div>
                        <div className="space-y-2">
                          <Label className={`font-display ${parentDisabled ? "text-muted-foreground" : ""}`}>Mother</Label>
                          <Input value={mother} onChange={(e) => setMother(e.target.value)} placeholder="Mother's name" className="rounded-xl" disabled={parentDisabled} />
                        </div>
                      </div>
                    )}
                  <Button type="submit" className="w-full rounded-full font-display" disabled={isPending}>
                    {isPending
                      ? (isEditing ? "Updating... ⏳" : "Registering... ⏳")
                      : (isEditing ? "Save Changes ✅" : "Register Member ✅")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground py-12">Loading family tree... 🌳</p>
          ) : members.length === 0 ? (
            <Card className="rounded-3xl border-2 text-center py-16">
              <CardContent>
                <div className="text-6xl mb-4">🌱</div>
                <h2 className="font-display text-xl mb-2">No members registered yet</h2>
                <p className="text-muted-foreground mb-4">Start building the family tree by adding the first member!</p>
                <Button className="rounded-full font-display" onClick={() => setDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" /> Plant the First Seed 🌱
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Tree connector line */}
              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-fun-purple/30 via-primary/30 to-fun-teal/30 hidden sm:block" />

                {TREE_CATEGORIES.map((cat, catIdx) => {
                  const catMembers = getMembersForCategory(cat.types);
                  const isExpanded = expandedCategories.includes(cat.id);

                  return (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: catIdx * 0.15 }}
                      className="relative"
                      style={{ marginLeft: `${catIdx * 24}px` }}
                    >
                      {/* Category button */}
                      <button
                        onClick={() => toggleCategory(cat.id)}
                        className={`w-full relative z-10 bg-gradient-to-r ${cat.gradient} border-2 ${cat.border} rounded-2xl ${cat.size} flex items-center gap-4 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 text-left group`}
                      >
                        <div className={`${cat.emojiSize} shrink-0 transition-transform duration-300 ${isExpanded ? "scale-110" : "group-hover:scale-110"}`}>
                          {cat.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className={`font-display ${cat.titleSize} font-bold ${cat.textColor}`}>
                            {cat.label}
                          </h2>
                          <p className="text-sm text-muted-foreground font-display truncate">
                            {cat.description} · {catMembers.length} member{catMembers.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className={`${cat.iconBg} rounded-full p-2 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
                          <ChevronDown className={`h-5 w-5 ${cat.textColor}`} />
                        </div>
                      </button>

                      {/* Expanded members list */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3 pb-1 sm:pl-12 pl-4 space-y-2">
                              {catMembers.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground font-display text-sm">
                                  No members in this category yet 🌿
                                </div>
                              ) : (
                                catMembers.map((member: any, idx: number) => (
                                  <motion.div
                                    key={member.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                  >
                                    <Card className={`rounded-xl border ${cat.border} bg-card hover:shadow-md transition-shadow`}>
                                      <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                                        {/* Avatar placeholder */}
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${cat.iconBg} flex items-center justify-center text-lg font-display font-bold ${cat.textColor} shrink-0`}>
                                          {member.first_name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-display font-semibold text-foreground truncate">
                                            {member.first_name} {member.last_name}
                                          </p>
                                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground font-display">
                                            <span className="flex items-center gap-1">
                                              <Calendar className="h-3 w-3" />
                                              {format(new Date(member.date_of_birth), "dd MMM yyyy")}
                                            </span>
                                            <span>
                                              {MEMBER_TYPES.find((t) => t.value === member.member_type)?.label || member.member_type}
                                            </span>
                                            {member.father && (
                                              <span>
                                                {member.member_type === "wife" ? "🤵" : member.member_type === "husband" ? "👰" : "👨"}{" "}
                                                {member.father}
                                              </span>
                                            )}
                                            {member.mother && !SPOUSE_TYPES.includes(member.member_type) && (
                                              <span>👩 {member.mother}</span>
                                            )}
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 rounded-full shrink-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(member);
                                          }}
                                          title="Edit member"
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default FamilyMembers;
