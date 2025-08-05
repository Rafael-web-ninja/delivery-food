-- Inserir role para usuário admin que tem delivery business
INSERT INTO public.user_roles (user_id, role)
VALUES ('9b96389c-93da-461f-b754-a81e34f3d30f', 'dono_delivery')
ON CONFLICT (user_id, role) DO NOTHING;

-- Inserir role para o outro usuário como cliente
INSERT INTO public.user_roles (user_id, role) 
VALUES ('069f0324-3506-46dd-8799-e47b37ac0d85', 'cliente')
ON CONFLICT (user_id, role) DO NOTHING;