-- Create storage bucket for tool mockups
INSERT INTO storage.buckets (id, name, public)
VALUES ('mockups', 'mockups', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to mockups
CREATE POLICY "Public can view mockups"
ON storage.objects FOR SELECT
USING (bucket_id = 'mockups');

-- Allow authenticated users to upload mockups (for admin use)
CREATE POLICY "Authenticated users can upload mockups"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'mockups' AND auth.role() = 'authenticated');