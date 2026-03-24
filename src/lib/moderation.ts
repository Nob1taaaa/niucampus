import { supabase } from "@/integrations/supabase/client";

export async function moderateContent(text: string, context?: string): Promise<{ safe: boolean; reason?: string }> {
  if (!text || text.trim().length === 0) return { safe: true };

  try {
    const { data, error } = await supabase.functions.invoke("moderate-content", {
      body: { text: text.trim(), context },
    });

    if (error) {
      console.error("Moderation error:", error);
      return { safe: true }; // Don't block on errors
    }

    return data as { safe: boolean; reason?: string };
  } catch (e) {
    console.error("Moderation service unavailable:", e);
    return { safe: true }; // Don't block on errors
  }
}
