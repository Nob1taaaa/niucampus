import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive regex-only filter (FREE - no API calls)
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ safe: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Pure regex filter — zero API cost
    const lower = text.toLowerCase();
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(lower)) {
        pattern.lastIndex = 0;
        return new Response(JSON.stringify({
          safe: false,
          reason: "Your message contains inappropriate language. Please keep it respectful and campus-friendly.",
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      pattern.lastIndex = 0;
    }

    return new Response(JSON.stringify({ safe: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Content moderation error:", error);
    return new Response(JSON.stringify({ safe: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
