-- Assign admin role to user with email 'admin@gmail.com'
-- This migration finds the user by email and grants them admin role

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM public.profiles
WHERE email = 'admin@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

