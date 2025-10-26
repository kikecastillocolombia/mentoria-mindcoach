-- Crear tabla de hábitos
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Habilitar RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- Políticas para habits
CREATE POLICY "Users can view their own habits"
ON public.habits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habits"
ON public.habits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
ON public.habits
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
ON public.habits
FOR DELETE
USING (auth.uid() = user_id);

-- Crear tabla de seguimiento de hábitos
CREATE TABLE public.habit_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(habit_id, date)
);

-- Habilitar RLS
ALTER TABLE public.habit_tracking ENABLE ROW LEVEL SECURITY;

-- Políticas para habit_tracking
CREATE POLICY "Users can view tracking for their habits"
ON public.habit_tracking
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.habits
  WHERE habits.id = habit_tracking.habit_id
  AND habits.user_id = auth.uid()
));

CREATE POLICY "Users can create tracking for their habits"
ON public.habit_tracking
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.habits
  WHERE habits.id = habit_tracking.habit_id
  AND habits.user_id = auth.uid()
));

CREATE POLICY "Users can update tracking for their habits"
ON public.habit_tracking
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.habits
  WHERE habits.id = habit_tracking.habit_id
  AND habits.user_id = auth.uid()
));

CREATE POLICY "Users can delete tracking for their habits"
ON public.habit_tracking
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.habits
  WHERE habits.id = habit_tracking.habit_id
  AND habits.user_id = auth.uid()
));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_habits_updated_at
BEFORE UPDATE ON public.habits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_habit_tracking_updated_at
BEFORE UPDATE ON public.habit_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();