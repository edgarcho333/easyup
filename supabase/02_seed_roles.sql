-- ============================================
-- SEED DATA: Roles
-- ============================================
-- Insert all system roles

INSERT INTO public.roles (name, display_name) VALUES
  ('super_admin', 'Super Admin'),
  ('account_manager', 'Account Manager'),
  ('copywriter', 'Copywriter'),
  ('designer', 'Designer'),
  ('content_creator', 'Content Creator'),
  ('advertiser', 'Advertiser'),
  ('client', 'Client')
ON CONFLICT (name) DO NOTHING;

-- Verify insertion
SELECT * FROM public.roles ORDER BY display_name;
