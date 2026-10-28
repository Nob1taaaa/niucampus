CREATE OR REPLACE FUNCTION public.is_study_group_member(_group uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.study_group_members WHERE group_id = _group AND user_id = _user)
$$;
CREATE OR REPLACE FUNCTION public.study_group_member_counts()
RETURNS TABLE(group_id uuid, members bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT group_id, count(*) FROM public.study_group_members GROUP BY group_id
$$;
GRANT EXECUTE ON FUNCTION public.study_group_member_counts() TO authenticated, anon;

DROP POLICY IF EXISTS "Signed-in users can view members" ON public.study_group_members;
CREATE POLICY "Members can view their group members" ON public.study_group_members
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_study_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Signed-in users can view attendees" ON public.event_attendees;
CREATE POLICY "Users can view own attendance" ON public.event_attendees
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Signed-in users can view campus responses" ON public.campus_post_responses;
CREATE POLICY "Responder or post owner can view responses" ON public.campus_post_responses
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.campus_posts p WHERE p.id = post_id AND p.user_id = auth.uid())
  );