-- ============================================================================
-- Add Sam (siriz0408@gmail.com) as Super Admin
-- Created: February 10, 2026
-- Description: Adds Sam's user account to admin_users table as super_admin
-- ============================================================================

-- Insert Sam as super_admin if not already exists
INSERT INTO public.admin_users (user_id, role, is_active, created_at)
SELECT 
  u.id,
  'super_admin',
  true,
  NOW()
FROM public.users u
WHERE u.email = 'siriz0408@gmail.com'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.admin_users au 
    WHERE au.user_id = u.id
  );

-- Verify insertion
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM public.admin_users au
  JOIN public.users u ON au.user_id = u.id
  WHERE u.email = 'siriz0408@gmail.com' AND au.is_active = true;
  
  IF admin_count = 0 THEN
    RAISE NOTICE 'Warning: Sam was not added as admin. User may not exist yet.';
  ELSE
    RAISE NOTICE 'Success: Sam added as super_admin';
  END IF;
END $$;
