import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { candidateEmail, candidateName, jobTitle, emailType, customMessage } = await req.json();

    if (!candidateEmail || !jobTitle || !emailType) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check recruiter role
    const { data: roleData } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "recruiter").maybeSingle();
    if (!roleData) throw new Error("Not a recruiter");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    // Generate professional email using AI
    const prompt = emailType === "interview"
      ? `Write a professional interview invitation email for ${candidateName} for the role of ${jobTitle}. ${customMessage ? `Additional note from recruiter: ${customMessage}` : ""} Keep it concise and professional. Return only the email body in HTML format with basic formatting.`
      : `Write a professional job offer/joining email for ${candidateName} for the role of ${jobTitle}. ${customMessage ? `Additional note from recruiter: ${customMessage}` : ""} Keep it concise and professional. Return only the email body in HTML format with basic formatting.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a professional HR email writer. Return only the HTML email body content, no subject line." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) throw new Error("AI generation failed");
    const aiData = await aiRes.json();
    const emailBody = aiData.choices?.[0]?.message?.content || "<p>We'd like to discuss the next steps for your application.</p>";

    const subject = emailType === "interview"
      ? `Interview Invitation - ${jobTitle}`
      : `Congratulations! Job Offer - ${jobTitle}`;

    // Return the generated email for preview (actual sending would need an email service)
    return new Response(JSON.stringify({
      success: true,
      subject,
      body: emailBody,
      to: candidateEmail,
      note: "Email content generated. Configure an email service to send automatically.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-candidate-email error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
