import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FUNCTION_NAME = "qa-assistant";
const MAX_REQUESTS_PER_DAY = 20;
const CACHE_TTL_HOURS = 24;

const systemPrompt =
  "You are a helpful, concise assistant for CSE students using an anonymous Q&A portal. " +
  "Give clear, practical advice about academics, careers, and campus life. " +
  "Avoid writing very long essays; focus on 3-6 key points and concrete next steps. " +
  "If the question is unsafe or outside your scope, say that briefly and suggest a safe alternative." +
  "\n\nFormat your response with clear headings using ## and bullet points for readability.";

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Missing messages array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // --- RATE LIMITING ---
    const { data: usageData } = await adminClient.rpc("get_user_ai_usage_today", {
      _user_id: user.id,
      _function_name: FUNCTION_NAME,
    });

    const todayCount = typeof usageData === "number" ? usageData : 0;
    if (todayCount >= MAX_REQUESTS_PER_DAY) {
      return new Response(JSON.stringify({
        error: `Daily limit reached (${MAX_REQUESTS_PER_DAY} questions/day). Come back tomorrow! 📚`,
        dailyLimit: true,
      }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- CACHE CHECK ---
    const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase().trim() || "";
    const cacheKey = `qa_${simpleHash(lastUserMsg)}`;

    const { data: cached } = await adminClient
      .from("ai_response_cache")
      .select("response_text, created_at")
      .eq("cache_key", cacheKey)
      .single();

    if (cached) {
      const cacheAge = (Date.now() - new Date(cached.created_at).getTime()) / 3600000;
      if (cacheAge < CACHE_TTL_HOURS) {
        return new Response(JSON.stringify({ assistantMessage: cached.response_text, cached: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // --- CALL OPENAI (gpt-4o-mini) ---
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 700,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "AI is busy right now. Please wait 30 seconds and try again. ⏳" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data?.choices?.[0]?.message?.content?.trim();
    if (!assistantMessage) throw new Error("Empty AI response");

    // --- LOG USAGE ---
    await adminClient.from("ai_usage_log").insert({
      user_id: user.id,
      function_name: FUNCTION_NAME,
    });

    // --- CACHE RESPONSE ---
    if (lastUserMsg.length > 10) {
      await adminClient.from("ai_response_cache").upsert({
        cache_key: cacheKey,
        function_name: FUNCTION_NAME,
        response_text: assistantMessage,
        created_at: new Date().toISOString(),
        hit_count: 0,
      }, { onConflict: "cache_key" }).then(() => {});
    }

    // --- PERIODIC CLEANUP (1% chance) ---
    if (Math.random() < 0.01) {
      adminClient.rpc("cleanup_old_ai_usage").then(() => {});
    }

    return new Response(JSON.stringify({
      assistantMessage,
      remainingToday: MAX_REQUESTS_PER_DAY - todayCount - 1,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("qa-assistant error:", errorMessage);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again.", details: errorMessage }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
