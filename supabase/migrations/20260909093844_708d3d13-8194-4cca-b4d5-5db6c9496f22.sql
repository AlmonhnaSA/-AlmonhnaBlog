ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#3b6561';

ALTER TABLE public.categories
ADD CONSTRAINT categories_color_format_check
CHECK (color ~ '^#[0-9A-Fa-f]{6}$');