-- Remove existing duplicate serials per user, keeping the newest row
DELETE FROM public.panels p
USING public.panels q
WHERE p.user_id = q.user_id
  AND lower(trim(p.serial)) = lower(trim(q.serial))
  AND (p.created_at < q.created_at OR (p.created_at = q.created_at AND p.id < q.id));

CREATE UNIQUE INDEX IF NOT EXISTS panels_user_serial_unique
  ON public.panels (user_id, lower(trim(serial)));
