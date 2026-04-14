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
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const sql = `
      CREATE TABLE IF NOT EXISTS public.notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        type text NOT NULL DEFAULT 'general',
        title text NOT NULL,
        message text NOT NULL,
        link text,
        is_read boolean NOT NULL DEFAULT false,
        created_at timestamp with time zone NOT NULL DEFAULT now()
      );

      ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view own notifications') THEN
          CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
        END IF;
      END $$;

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update own notifications') THEN
          CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
        END IF;
      END $$;

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can delete own notifications') THEN
          CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
        END IF;
      END $$;

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Service can insert notifications') THEN
          CREATE POLICY "Service can insert notifications" ON public.notifications FOR INSERT TO public WITH CHECK (true);
        END IF;
      END $$;

      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
    `;

    const { error } = await adminClient.rpc("exec_sql", { sql_text: sql });

    // If the rpc doesn't exist, try direct query via REST
    if (error) {
      // Fall back to running via pg
      const dbUrl = Deno.env.get("SUPABASE_DB_URL");
      if (!dbUrl) {
        return new Response(JSON.stringify({ error: "Cannot run SQL - no DB URL", rpcError: error.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use pg to run the SQL
      const { Pool } = await import("https://deno.land/x/postgres@v0.19.3/mod.ts");
      const pool = new Pool(dbUrl, 1);
      const connection = await pool.connect();
      try {
        await connection.queryObject(sql);
      } finally {
        connection.release();
        await pool.end();
      }
    }

    // Enable realtime
    try {
      const dbUrl = Deno.env.get("SUPABASE_DB_URL");
      if (dbUrl) {
        const { Pool } = await import("https://deno.land/x/postgres@v0.19.3/mod.ts");
        const pool = new Pool(dbUrl, 1);
        const connection = await pool.connect();
        try {
          await connection.queryObject("ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications");
        } catch (_e) {
          // already added
        } finally {
          connection.release();
          await pool.end();
        }
      }
    } catch (_e) { /* ignore */ }

    return new Response(JSON.stringify({ success: true, message: "Notifications table created" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("init-notifications error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
