import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get today's date parts
    const now = new Date();
    const todayMonth = now.getMonth() + 1;
    const todayDay = now.getDate();

    // Fetch all family members
    const { data: familyMembers, error: fmError } = await supabase
      .from("family_members")
      .select("first_name, last_name, date_of_birth");

    if (fmError) throw fmError;

    // Find birthday people today
    const birthdayPeople = (familyMembers || []).filter((m: any) => {
      const [_, month, day] = m.date_of_birth.split("-").map(Number);
      return month === todayMonth && day === todayDay;
    });

    if (birthdayPeople.length === 0) {
      return new Response(
        JSON.stringify({ message: "No birthdays today 🎉", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all registered user emails
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    const emails = (users || [])
      .filter((u: any) => u.email && u.email_confirmed_at)
      .map((u: any) => u.email);

    if (emails.length === 0) {
      return new Response(
        JSON.stringify({ message: "No verified users to email", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalSent = 0;

    for (const person of birthdayPeople) {
      const fullName = `${person.first_name} ${person.last_name}`;
      const dob = person.date_of_birth;
      const [birthYear] = dob.split("-").map(Number);
      const age = now.getFullYear() - birthYear;

      const subject = `🎂 It's ${person.first_name}'s Birthday Today! Send Some Love! 🎉`;

      const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    
    <div style="background:linear-gradient(135deg,#FF6B6B,#FFE66D,#4ECDC4);padding:30px;border-radius:20px;text-align:center;">
      <div style="font-size:60px;margin-bottom:10px;">🎂🎈🎉</div>
      <h1 style="color:#ffffff;font-size:28px;margin:0;text-shadow:1px 1px 3px rgba(0,0,0,0.2);">
        Happy Birthday, ${person.first_name}! 🥳
      </h1>
    </div>

    <div style="padding:30px 20px;text-align:center;">
      <p style="font-size:18px;color:#333333;line-height:1.6;">
        Hey Fomuso Family! 👋
      </p>
      <p style="font-size:16px;color:#555555;line-height:1.8;">
        Today is a special day — our very own <strong style="color:#FF6B6B;">${fullName}</strong> 
        is celebrating ${age > 0 ? `<strong>${age} amazing years</strong>` : 'another wonderful year'} of life! 🌟
      </p>
      
      <div style="background:#FFF8E1;border-radius:16px;padding:25px;margin:25px 0;border:2px dashed #FFE066;">
        <p style="font-size:22px;margin:0 0 10px 0;">💛</p>
        <p style="font-size:16px;color:#555555;margin:0;line-height:1.6;">
          Let's show ${person.first_name} some love today!<br/>
          Drop a message, make a call, send a voice note — 
          <strong>whatever it takes to make their day extra special!</strong> 🎊
        </p>
      </div>

      <p style="font-size:15px;color:#777777;line-height:1.6;font-style:italic;">
        "Family isn't just an important thing, it's everything." 💕
      </p>

      <div style="margin-top:30px;">
        <p style="font-size:14px;color:#999999;">
          With love from the Fomuso Family Hub 🏡<br/>
          <span style="font-size:24px;">👨‍👩‍👧‍👦❤️</span>
        </p>
      </div>
    </div>

    <div style="text-align:center;padding:15px;border-top:1px solid #eeeeee;">
      <p style="font-size:12px;color:#bbbbbb;margin:0;">
        You're receiving this because you're part of the Fomuso Family Hub 🌍
      </p>
    </div>
  </div>
</body>
</html>`;

      // Send to all members using Resend (batch via BCC)
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Fomuso Family Hub <onboarding@resend.dev>",
          to: emails,
          subject,
          html: htmlBody,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        console.error(`Failed to send birthday email for ${fullName}:`, resData);
      } else {
        totalSent++;
        console.log(`Birthday email sent for ${fullName} to ${emails.length} members`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Birthday emails sent for ${birthdayPeople.length} member(s)`,
        sent: totalSent,
        recipients: emails.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Birthday email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
