import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `You are a senior CSE mentor helping a student plan their weekly study and placement prep.

Constraints:
- The student is in an Indian engineering college context (CSE/IT).
- They usually have labs, internal tests, and project work.
- Your plan must be realistic for the given "hours per week" in the profile.
- If hours are very low (<= 5), give a tiny but still helpful plan instead of overloading them.
- Do not exceed the approximate total hours they mentioned by more than 20%.
- Prefer evening / early-morning slots on weekdays and flexible slots on weekends.

Output format (use clear headings and bullet points):
1) "Overview" – 3-6 lines summarising the main strategy.
2) "Weekly timetable" – for each day Mon–Sun, give 2-4 bullet points with concrete time ranges (e.g. 7–9 pm) and specific tasks.
3) "Non‑negotiable habits" – 3–6 short bullets about daily/weekly habits.
4) "Next 4 weeks milestones" – 4–8 bullets with measurable, realistic goals.

Tone: Encouraging but honest. Very specific and actionable.`;

function makeUserPrompt(body: Record<string, unknown>) {
  const userProfileSummary = `
Student profile:
- Semester / year: ${body.semester || "not specified"}
- Target role or goal: ${body.targetRole || "not specified"}
- Available hours per week: ${body.hoursPerWeek || "not specified"}
- Focus areas: ${Array.isArray(body.focusAreas) ? body.focusAreas.join(", ") : body.focusAreas || "not specified"}
- Upcoming exams or deadlines: ${body.upcomingExams || "not specified"}
- Extra constraints or notes: ${body.extraContext || "none"}
`.trim();

  return `Create a personalised weekly study & placement plan.\n\n${userProfileSummary}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired authentication token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const prompt = makeUserPrompt(body ?? {});

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: 2048,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "AI is busy, please try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI usage limit reached. Please try again later." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const plan = data?.choices?.[0]?.message?.content?.trim();
    if (!plan) throw new Error("Empty AI response");

    return new Response(JSON.stringify({ plan }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("study-planner error:", errorMessage);
    return new Response(JSON.stringify({ error: "Failed to generate study plan", details: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
