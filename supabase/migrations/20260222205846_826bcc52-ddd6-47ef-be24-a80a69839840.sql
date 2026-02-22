
-- Events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view events"
ON public.events FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create events"
ON public.events FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their events"
ON public.events FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Creators and admins can delete events"
ON public.events FOR DELETE USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RSVPs table
CREATE TABLE public.event_rsvps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view RSVPs"
ON public.event_rsvps FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can RSVP"
ON public.event_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own RSVP"
ON public.event_rsvps FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own RSVP"
ON public.event_rsvps FOR DELETE USING (auth.uid() = user_id);
