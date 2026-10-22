DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;
CREATE POLICY "Service can insert notifications" ON public.notifications FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Reunions are viewable by everyone" ON public.lost_found_reunions;
CREATE POLICY "Participants can view their reunions" ON public.lost_found_reunions FOR SELECT TO authenticated USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE VIEW public.lost_found_reunion_highlights WITH (security_invoker = false) AS
SELECT r.id, r.post_id, r.created_at, p.title AS post_title
FROM public.lost_found_reunions r JOIN public.lost_found_posts p ON p.id = r.post_id
WHERE r.confirmed_by_user1 = TRUE AND r.confirmed_by_user2 = TRUE;
GRANT SELECT ON public.lost_found_reunion_highlights TO anon, authenticated;

CREATE TABLE public.lost_found_post_secrets (
  post_id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  secret_answer text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lost_found_post_secrets TO authenticated;
GRANT ALL ON public.lost_found_post_secrets TO service_role;
ALTER TABLE public.lost_found_post_secrets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can view own secret answer" ON public.lost_found_post_secrets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can add own secret answer" ON public.lost_found_post_secrets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update own secret answer" ON public.lost_found_post_secrets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can delete own secret answer" ON public.lost_found_post_secrets FOR DELETE TO authenticated USING (auth.uid() = user_id);
INSERT INTO public.lost_found_post_secrets (post_id, user_id, secret_answer)
SELECT id, user_id, secret_answer FROM public.lost_found_posts
WHERE secret_answer IS NOT NULL AND btrim(secret_answer) <> '';
ALTER TABLE public.lost_found_posts DROP COLUMN IF EXISTS secret_answer;