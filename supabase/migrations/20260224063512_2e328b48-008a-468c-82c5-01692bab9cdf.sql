
-- Chat threads table
CREATE TABLE public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'group' CHECK (type IN ('group', 'direct')),
  title text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Chat thread members junction table
CREATE TABLE public.chat_thread_members (
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  member_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, member_id)
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  is_deleted boolean NOT NULL DEFAULT false
);

-- Add last_seen_at to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- Enable RLS
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_thread_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS: chat_threads
CREATE POLICY "Users can view threads they belong to"
  ON public.chat_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_thread_members
      WHERE thread_id = chat_threads.id AND member_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create threads"
  ON public.chat_threads FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- RLS: chat_thread_members
CREATE POLICY "Members can view thread members"
  ON public.chat_thread_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_thread_members AS ctm
      WHERE ctm.thread_id = chat_thread_members.thread_id AND ctm.member_id = auth.uid()
    )
  );

CREATE POLICY "Thread creators and admins can add members"
  ON public.chat_thread_members FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.chat_threads
        WHERE id = thread_id AND created_by = auth.uid()
      )
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Members can remove themselves"
  ON public.chat_thread_members FOR DELETE
  USING (member_id = auth.uid());

-- RLS: chat_messages
CREATE POLICY "Members can view messages in their threads"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_thread_members
      WHERE thread_id = chat_messages.thread_id AND member_id = auth.uid()
    )
  );

CREATE POLICY "Members can send messages to their threads"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_thread_members
      WHERE thread_id = chat_messages.thread_id AND member_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messages"
  ON public.chat_messages FOR UPDATE
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete own messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = sender_id OR has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_thread_members;

-- Create indexes for performance
CREATE INDEX idx_chat_messages_thread_id ON public.chat_messages(thread_id, created_at);
CREATE INDEX idx_chat_thread_members_member ON public.chat_thread_members(member_id);
