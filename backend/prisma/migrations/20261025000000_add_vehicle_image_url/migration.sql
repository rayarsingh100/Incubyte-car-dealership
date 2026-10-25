-- Preserve the manually added production column while recording this change in Prisma migration history.
-- Fresh databases receive the column here; an existing column must already match the nullable TEXT contract.
DO $migration$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Vehicle'
          AND column_name = 'imageUrl'
          AND (data_type <> 'text' OR is_nullable <> 'YES')
    ) THEN
        RAISE EXCEPTION 'public.Vehicle.imageUrl exists but is not nullable TEXT';
    END IF;

    ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
END
$migration$;
