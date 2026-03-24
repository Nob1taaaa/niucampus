
-- Create trigger to auto-create profile when a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also insert profiles for any existing users who don't have one
INSERT INTO public.profiles (id, full_name, avatar_url)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'full_name', ''),
       COALESCE(u.raw_user_meta_data->>'avatar_url', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
