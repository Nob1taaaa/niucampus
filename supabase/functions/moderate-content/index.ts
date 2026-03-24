import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Common vulgar/offensive words list (basic filter before AI check)
const BLOCKED_PATTERNS = [
  /\bf+u+c+k+/gi, /\bs+h+i+t+/gi, /\ba+s+s+h+o+l+e/gi, /\bb+i+t+c+h/gi,
  /\bd+a+m+n/gi, /\bb+a+s+t+a+r+d/gi, /\bw+h+o+r+e/gi, /\bs+l+u+t/gi,
  /\bd+i+c+k/gi, /\bp+u+s+s+y/gi, /\bc+u+n+t/gi, /\bn+i+g+g/gi,
  /\bf+a+g+/gi, /\br+a+p+e/gi, /\bk+i+l+l\s+(you|him|her|them)/gi,
  /\bt+h+r+e+a+t/gi, /\bb+o+m+b/gi, /\bg+u+n/gi, /\bd+r+u+g+s?/gi,
  /\bw+e+e+d/gi, /\bp+o+r+n/gi, /\bn+u+d+e/gi, /\bs+e+x/gi,
  /\bmadarchod/gi, /\bbhenchod/gi, /\bchutiya/gi, /\bgaand/gi,
  /\blavde/gi, /\brandi/gi, /\bharami/gi, /\bkamina/gi,
];

function quickFilter(text: string): { blocked: boolean; reason?: string } {
  const lower = text.toLowerCase();
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(lower)) {
      return { blocked: true, reason: "Your message contains inappropriate language. Please keep it respectful and campus-friendly." };
    }
    // Reset regex lastIndex
    pattern.lastIndex = 0;
  }
  return { blocked: false };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, context } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ safe: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 1: Quick regex filter (free, instant)
    const quickResult = quickFilter(text);
    if (quickResult.blocked) {
      return new Response(JSON.stringify({
        safe: false,
        reason: quickResult.reason,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 2: For longer texts, use OpenAI moderation (more nuanced)
    if (text.length > 10) {
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      if (openaiKey) {
        try {
          const modResponse = await fetch('https://api.openai.com/v1/moderations', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: text }),
          });

          if (modResponse.ok) {
            const modData = await modResponse.json();
            const result = modData.results?.[0];
            if (result?.flagged) {
              const categories = Object.entries(result.categories || {})
                .filter(([_, flagged]) => flagged)
                .map(([cat]) => cat);

              return new Response(JSON.stringify({
                safe: false,
                reason: "Your content was flagged for potentially inappropriate material. Please keep posts respectful and appropriate for a college environment.",
                categories,
              }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
          }
        } catch (e) {
          // If moderation API fails, fall through (don't block user)
          console.error("Moderation API error:", e);
        }
      }
    }

    return new Response(JSON.stringify({ safe: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Content moderation error:", error);
    // On error, allow content through (don't block users due to service issues)
    return new Response(JSON.stringify({ safe: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
