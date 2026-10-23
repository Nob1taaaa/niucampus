DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Signed-in users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Members are viewable by everyone" ON public.study_group_members;
CREATE POLICY "Signed-in users can view members" ON public.study_group_members FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Attendees are viewable by everyone" ON public.event_attendees;
CREATE POLICY "Signed-in users can view attendees" ON public.event_attendees FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON public.event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.study_material_bookmarks(user_id);