DROP POLICY IF EXISTS "campus responses readable by students" ON public.campus_post_responses;
CREATE POLICY "Signed-in users can view campus responses" ON public.campus_post_responses FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Matches viewable by everyone" ON public.lost_found_matches;
CREATE POLICY "Signed-in users can view matches" ON public.lost_found_matches FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);