import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { post_id, title, description, location, type } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Fetch opposite-type posts (lost matches found, found matches lost)
    const oppositeType = type === "lost" ? "found" : "lost";
    const postsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/lost_found_posts?type=eq.${oppositeType}&is_resolved=eq.false&id=neq.${post_id}&select=id,title,description,location`,
      { headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
    );
    const existingPosts = await postsRes.json();
    
    if (!existingPosts || existingPosts.length === 0) {
      return new Response(JSON.stringify({ matches: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Use AI to find matches
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a lost & found matching assistant. Compare the new post against existing posts. Return ONLY matching post IDs with similarity scores (0-1). Respond with a JSON array like [{\"id\":\"uuid\",\"score\":0.8}]. Consider item descriptions, locations, and timing. Return empty array [] if no matches." },
          { role: "user", content: `New ${type} post:\nTitle: ${title}\nDescription: ${description}\nLocation: ${location}\n\nExisting ${oppositeType} posts:\n${JSON.stringify(existingPosts)}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_matches",
            description: "Return matching posts with similarity scores",
            parameters: {
              type: "object",
              properties: {
                matches: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      score: { type: "number" }
                    },
                    required: ["id", "score"],
                    additionalProperties: false
                  }
                }
              },
              required: ["matches"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "return_matches" } }
      }),
    });

    if (!aiRes.ok) {
      console.error("AI error:", await aiRes.text());
      return new Response(JSON.stringify({ matches: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiRes.json();
    let matches: { id: string; score: number }[] = [];
    
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const parsed = JSON.parse(toolCall.function.arguments);
        matches = parsed.matches.filter((m: any) => m.score >= 0.4);
      }
    } catch (e) {
      console.error("Parse error:", e);
    }

    // Store matches in DB
    if (matches.length > 0) {
      const insertData = matches.map(m => ({
        post_id: post_id,
        matched_post_id: m.id,
        similarity_score: m.score
      }));
      
      await fetch(`${SUPABASE_URL}/rest/v1/lost_found_matches`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify(insertData)
      });
    }

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("match-posts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
