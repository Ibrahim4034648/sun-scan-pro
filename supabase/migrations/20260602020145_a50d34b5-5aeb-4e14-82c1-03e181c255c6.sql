-- Projects table
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  customer text NOT NULL,
  project_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own projects" ON public.projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Panels table
CREATE TABLE public.panels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name text,
  customer text,
  serial text NOT NULL,
  model text,
  warranty_years int,
  install_date text,
  install_time text,
  location text,
  notes text,
  status text DEFAULT 'نشط',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_panels_user ON public.panels(user_id);
CREATE INDEX idx_panels_project ON public.panels(project_id);
CREATE UNIQUE INDEX idx_panels_user_serial ON public.panels(user_id, serial);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.panels TO authenticated;
GRANT ALL ON public.panels TO service_role;

ALTER TABLE public.panels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own panels" ON public.panels FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own panels" ON public.panels FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own panels" ON public.panels FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own panels" ON public.panels FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Auto-update updated_at on projects
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER projects_set_updated_at BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();