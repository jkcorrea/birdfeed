-- Allow anyone to upload to Supabase storage
DO $$
BEGIN
-- Avoid applying to shadow db
IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
  CREATE POLICY "allow_public_uploads" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'birdfeed-transcription-files');
END IF;
END$$;
