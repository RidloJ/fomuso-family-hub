import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getLastSunday(year: number, month: number): string {
  const last = new Date(year, month, 0); // last day of month
  const day = last.getDay(); // 0=Sun
  if (day !== 0) last.setDate(last.getDate() - day);
  return last.toISOString().split("T")[0];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Determine target month (current month, or override via body)
    let targetMonth: number;
    let targetYear: number;

    try {
      const body = await req.json();
      targetMonth = body?.month || new Date().getMonth() + 1;
      targetYear = body?.year || new Date().getFullYear();
    } catch {
      const now = new Date();
      targetMonth = now.getMonth() + 1;
      targetYear = now.getFullYear();
    }

    // Check if period already exists
    const { data: existing } = await supabase
      .from("njangi_periods")
      .select("id")
      .eq("period_month", targetMonth)
      .eq("period_year", targetYear)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ message: `Period ${targetMonth}/${targetYear} already exists`, id: existing.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get active members to calculate expected total
    const { data: members } = await supabase
      .from("njangi_members")
      .select("expected_monthly_amount")
      .eq("active", true);

    const expectedTotal = (members || []).reduce(
      (sum: number, m: any) => sum + (Number(m.expected_monthly_amount) || 0),
      0
    );

    const deadline = getLastSunday(targetYear, targetMonth);

    // Get an admin user to use as created_by
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: "No admin user found to create period" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: created, error } = await supabase
      .from("njangi_periods")
      .insert({
        period_month: targetMonth,
        period_year: targetYear,
        deadline_date: deadline,
        expected_total: expectedTotal,
        balance_left: expectedTotal,
        created_by: adminRole.user_id,
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`Created njangi period for ${targetMonth}/${targetYear}`);

    return new Response(
      JSON.stringify({ message: `Period ${targetMonth}/${targetYear} created`, period: created }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error creating njangi period:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
