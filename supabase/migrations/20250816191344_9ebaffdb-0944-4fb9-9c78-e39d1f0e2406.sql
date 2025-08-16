-- Adicionar política para usuários autenticados poderem ver businesses ativos
CREATE POLICY "Authenticated users can view active businesses" 
ON public.delivery_businesses 
FOR SELECT 
USING (is_active = true AND auth.role() = 'authenticated');