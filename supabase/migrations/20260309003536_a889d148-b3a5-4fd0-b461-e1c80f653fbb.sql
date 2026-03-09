CREATE TABLE public.hand_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  position TEXT NOT NULL,
  result_bb NUMERIC(10, 2) NOT NULL DEFAULT 0,
  vpip BOOLEAN NOT NULL DEFAULT false,
  pfr BOOLEAN NOT NULL DEFAULT false,
  three_bet BOOLEAN NOT NULL DEFAULT false,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hand_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hand sessions"
  ON public.hand_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hand sessions"
  ON public.hand_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own hand sessions"
  ON public.hand_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all hand sessions"
  ON public.hand_sessions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_hand_sessions_user_date ON public.hand_sessions(user_id, session_date);