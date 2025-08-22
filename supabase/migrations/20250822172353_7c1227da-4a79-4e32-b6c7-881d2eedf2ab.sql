-- SECURITY FIX: The bd-delibery table has overly permissive RLS policies
-- that allow unrestricted access. Since this table appears to be unused
-- in the application, we'll drop it to eliminate the security risk.

-- First, drop the existing overly permissive policies
DROP POLICY IF EXISTS "Allow delete access" ON public."bd-delibery";
DROP POLICY IF EXISTS "Allow insert access" ON public."bd-delibery";
DROP POLICY IF EXISTS "Allow read access" ON public."bd-delibery";
DROP POLICY IF EXISTS "Allow update access" ON public."bd-delibery";

-- Drop the table entirely since it's not used in the application
DROP TABLE IF EXISTS public."bd-delibery";