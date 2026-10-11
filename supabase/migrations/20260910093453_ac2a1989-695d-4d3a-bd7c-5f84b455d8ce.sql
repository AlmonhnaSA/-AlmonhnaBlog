ALTER TABLE public.quote_cards
ADD COLUMN background_color text NOT NULL DEFAULT '#0f3833',
ADD COLUMN text_color text NOT NULL DEFAULT '#ffffff';

ALTER TABLE public.quote_cards
ADD CONSTRAINT quote_cards_background_color_format CHECK (background_color ~ '^#[0-9A-Fa-f]{6}$'),
ADD CONSTRAINT quote_cards_text_color_format CHECK (text_color ~ '^#[0-9A-Fa-f]{6}$');