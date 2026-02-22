
-- Storage bucket for gallery media
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload gallery media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gallery' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view gallery media"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

CREATE POLICY "Users can delete their own gallery media"
ON storage.objects FOR DELETE
USING (bucket_id = 'gallery' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Albums table
CREATE TABLE public.albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view albums"
ON public.albums FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create albums"
ON public.albums FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their albums"
ON public.albums FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Creators and admins can delete albums"
ON public.albums FOR DELETE USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_albums_updated_at
BEFORE UPDATE ON public.albums
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Media table
CREATE TABLE public.media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  media_type TEXT NOT NULL DEFAULT 'image',
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view media"
ON public.media FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload media"
ON public.media FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Uploaders can delete their media"
ON public.media FOR DELETE USING (auth.uid() = uploaded_by OR has_role(auth.uid(), 'admin'));

-- Likes table
CREATE TABLE public.media_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(media_id, user_id)
);

ALTER TABLE public.media_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view likes"
ON public.media_likes FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can like"
ON public.media_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike"
ON public.media_likes FOR DELETE USING (auth.uid() = user_id);

-- Comments table
CREATE TABLE public.media_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.media_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view comments"
ON public.media_comments FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can comment"
ON public.media_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.media_comments FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
