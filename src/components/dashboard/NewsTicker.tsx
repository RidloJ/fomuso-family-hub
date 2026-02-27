import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { getDaysToDeadline, getDeadlineLabel } from "@/lib/njangi-utils";

function parseLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const NewsTicker = () => {
  const now = new Date();
  const currentYear = now.getFullYear();

  const { data: nextBirthday } = useQuery({
    queryKey: ["next-birthday-ticker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("first_name, last_name, date_of_birth");
      if (error) throw error;
      if (!data?.length) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = data
        .map((m) => {
          const dob = parseLocalDate(m.date_of_birth);
          const thisYear = new Date(currentYear, dob.getMonth(), dob.getDate());
          if (thisYear < today) thisYear.setFullYear(currentYear + 1);
          return { ...m, nextDate: thisYear };
        })
        .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());

      return upcoming[0] || null;
    },
  });

  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const daysToDeadline = getDaysToDeadline(year, month);
  const deadlineLabel = getDeadlineLabel(year, month);

  const items: string[] = [];

  if (nextBirthday) {
    const d = nextBirthday.nextDate;
    const daysUntil = Math.ceil((d.getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
    const dateStr = format(d, "MMMM d");
    if (daysUntil === 0) {
      items.push(`🎂 Happy Birthday to ${nextBirthday.first_name} ${nextBirthday.last_name} today! Send them love! 🎉`);
    } else if (daysUntil === 1) {
      items.push(`🎂 ${nextBirthday.first_name} ${nextBirthday.last_name}'s birthday is TOMORROW (${dateStr})! Don't forget to wish them! 🎈`);
    } else {
      items.push(`🎂 ${nextBirthday.first_name} ${nextBirthday.last_name}'s birthday is coming up on ${dateStr} — only ${daysUntil} days away! 🎈`);
    }
  }

  if (daysToDeadline >= 0) {
    items.push(`💰 Njangi deadline: ${deadlineLabel} — ${daysToDeadline} day${daysToDeadline !== 1 ? "s" : ""} left to contribute! Let's keep it going, family! 💪`);
  } else {
    items.push(`💰 Njangi deadline has passed for this month. Check your contributions! 📋`);
  }

  if (!items.length) return null;

  const text = items.join("   •   ");
  const repeated = `${text}   •   ${text}`;

  return (
    <div className="w-full overflow-hidden bg-primary py-2.5 shadow-md">
      <motion.div
        className="whitespace-nowrap font-display text-sm text-primary-foreground font-semibold tracking-wide"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        {repeated}
      </motion.div>
    </div>
  );
};

export default NewsTicker;
