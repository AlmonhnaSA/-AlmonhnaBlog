REVOKE EXECUTE ON FUNCTION public.handle_approved_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_signup() FROM anon, authenticated;