
-- Garantir REPLICA IDENTITY FULL (idempotente)
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Adicionar a tabela 'orders' à publicação supabase_realtime somente se ainda não estiver presente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;
