-- Confirmar o email do usuário demo manualmente
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'admin@deliveryfacil.com';