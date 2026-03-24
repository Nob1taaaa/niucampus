
-- Create study_materials table
CREATE TABLE public.study_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'link',
  subject TEXT NOT NULL DEFAULT 'general',
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  external_url TEXT,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Study materials viewable by everyone" ON public.study_materials FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload materials" ON public.study_materials FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own materials" ON public.study_materials FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own materials" ON public.study_materials FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_study_materials_updated_at BEFORE UPDATE ON public.study_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for study materials
INSERT INTO storage.buckets (id, name, public) VALUES ('study-materials', 'study-materials', true);

-- Storage RLS policies
CREATE POLICY "Anyone can view study materials files" ON storage.objects FOR SELECT USING (bucket_id = 'study-materials');
CREATE POLICY "Authenticated users can upload study materials" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'study-materials');
CREATE POLICY "Users can delete their own study material files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'study-materials' AND (storage.foldername(name))[1] = auth.uid()::text);
