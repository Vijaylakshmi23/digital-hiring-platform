-- Create direct messages table for personalized chat between hirer and worker
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT different_users CHECK (sender_id != receiver_id)
);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for direct messages
CREATE POLICY "Users can view messages they sent or received"
ON public.direct_messages
FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

CREATE POLICY "Users can send direct messages"
ON public.direct_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Create index for better performance
CREATE INDEX idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX idx_direct_messages_receiver ON public.direct_messages(receiver_id);
CREATE INDEX idx_direct_messages_created_at ON public.direct_messages(created_at DESC);

-- Enable realtime for direct messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;