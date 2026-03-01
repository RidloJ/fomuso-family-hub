import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [father, setFather] = useState("");
  const [mother, setMother] = useState("");
  const [memberType, setMemberType] = useState<MemberType>("children");
  const [submitting, setSubmitting] = useState(false);

  const parentDisabled = PARENT_DISABLED_TYPES.includes(memberType);
  const isSpouseType = SPOUSE_TYPES.includes(memberType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!firstName.trim() || !lastName.trim() || !dob) {
      toast({ title: "Missing info", description: "All required fields must be filled.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Insert family member record
      const { error: fmError } = await supabase.from("family_members").insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: dob,
        father: parentDisabled ? null : (father.trim() || null),
        mother: (parentDisabled || isSpouseType) ? null : (mother.trim() || null),
        member_type: memberType,
        created_by: user.id,
      } as any);
      if (fmError) throw fmError;

      // Mark registration as complete
      const { error: profError } = await supabase
        .from("profiles")
        .update({ registration_complete: true, full_name: `${firstName.trim()} ${lastName.trim()}` } as any)
        .eq("user_id", user.id);
      if (profError) throw profError;

      toast({ title: "Welcome to the family! 🎉", description: "Your registration is complete." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading... ⏳</div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="rounded-3xl border-2 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="text-5xl mb-2">🌳</div>
            <CardTitle className="font-display text-2xl">Join the Family Tree</CardTitle>
            <p className="text-sm text-muted-foreground font-display mt-1">
              Complete your family registration to access the app
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-display">First Name *</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. John"
                    required
                    className="rounded-xl"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-display">Last Name *</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Fomuso"
                    required
                    className="rounded-xl"
                    maxLength={100}
                  />
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
                    <SelectValue placeholder="Select your role in the family" />
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
                <Input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>

              {isSpouseType ? (
                <div className="space-y-2">
                  <Label className="font-display">
                    {memberType === "wife" ? "Husband's Name 🤵 *" : "Wife's Name 👰 *"}
                  </Label>
                  <Input
                    value={father}
                    onChange={(e) => setFather(e.target.value)}
                    placeholder={memberType === "wife" ? "Husband's name" : "Wife's name"}
                    required
                    className="rounded-xl"
                    maxLength={100}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={`font-display ${parentDisabled ? "text-muted-foreground" : ""}`}>
                      Father {!parentDisabled ? "*" : ""}
                    </Label>
                    <Input
                      value={father}
                      onChange={(e) => setFather(e.target.value)}
                      placeholder="Father's name"
                      className="rounded-xl"
                      disabled={parentDisabled}
                      required={!parentDisabled}
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={`font-display ${parentDisabled ? "text-muted-foreground" : ""}`}>
                      Mother {!parentDisabled ? "*" : ""}
                    </Label>
                    <Input
                      value={mother}
                      onChange={(e) => setMother(e.target.value)}
                      placeholder="Mother's name"
                      className="rounded-xl"
                      disabled={parentDisabled}
                      required={!parentDisabled}
                      maxLength={100}
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full rounded-full font-display text-lg py-6" disabled={submitting}>
                {submitting ? "Registering... ⏳" : "Complete Registration 🎉"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Onboarding;
