-- Add updated_at to digital_presence and trigger to keep it current
DO $$ BEGIN
  -- Add column if missing
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'digital_presence'
      AND column_name  = 'updated_at'
  ) THEN
    ALTER TABLE public.digital_presence
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- Create or replace trigger to auto-update updated_at on changes
DO $$ BEGIN
  -- Drop existing trigger if any (safe if not exists)
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_digital_presence_updated_at'
  ) THEN
    DROP TRIGGER update_digital_presence_updated_at ON public.digital_presence;
  END IF;

  -- Create trigger using existing helper function
  CREATE TRIGGER update_digital_presence_updated_at
  BEFORE UPDATE ON public.digital_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
END $$;