import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, post_id, claimant_name, post_title, target_user_id } = await req.json();

    if (!type || !target_user_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let title = "";
    let message = "";
    let link: string | null = "/lost-found";

    switch (type) {
      case "claim":
        title = "Someone claimed your item! 🙋";
        message = `${claimant_name || "A student"} has submitted a claim for "${post_title || "your item"}". Review it now!`;
        break;
      case "claim_accepted":
        title = "Your claim was accepted! ✅";
        message = `Your claim for "${post_title || "an item"}" has been accepted. Open the chat to coordinate pickup.`;
        break;
      case "claim_rejected":
        title = "Claim update ❌";
        message = `Your claim for "${post_title || "an item"}" was not accepted. The verification answer didn't match.`;
        link = null;
        break;
      case "match":
        title = "Potential match found! 🔗";
        message = `We found a possible match for "${post_title || "your post"}". Check it out!`;
        break;
      case "reunion":
        title = "Item reunited! 🎉";
        message = `"${post_title || "An item"}" has been successfully returned. Great news!`;
        break;
      case "new_post":
        title = "New lost item reported 📦";
        message = `"${post_title || "An item"}" was just reported. Check if it's yours!`;
        break;
      case "found_report":
        title = "Someone found your item! 🎉";
        message = `A student says they found "${post_title || "your item"}". Review their message now!`;
        break;
      default:
        title = "Notification";
        message = "You have a new notification.";
    }

    const { error } = await adminClient.from("notifications").insert({
      user_id: target_user_id,
      type,
      title,
      message,
      link,
    });

    if (error) {
      console.error("Insert notification error:", error);
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("notify-claim error:", error);
    return new Response(JSON.stringify({ error: "Failed to send notification" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
