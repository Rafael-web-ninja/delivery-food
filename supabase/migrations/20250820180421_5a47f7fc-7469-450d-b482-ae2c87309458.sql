-- Resetar senhas dos usuários de teste para facilitar o teste
-- Usando uma senha padrão: teste123

-- Update user password for delivery4@teste.com (owner)
UPDATE auth.users 
SET encrypted_password = crypt('teste123', gen_salt('bf'))
WHERE email = 'delivery4@teste.com';

-- Update user password for maria@teste.com (customer)  
UPDATE auth.users 
SET encrypted_password = crypt('teste123', gen_salt('bf'))
WHERE email = 'maria@teste.com';

-- Ensure users are confirmed (no email confirmation needed for testing)
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmation_token = null,
    confirmation_sent_at = null
WHERE email IN ('delivery4@teste.com', 'maria@teste.com');