import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Consome os tokens do hash (enviados pelo Supabase no link de e-mail),
    // cria a sessão de recuperação e limpa a URL.
    const prepareRecoverySession = async () => {
      try {
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.substring(1)
          : '';
        const params = new URLSearchParams(hash);

        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const type = params.get('type');
        const error = params.get('error');

        if (error) {
          toast({
            title: 'Link inválido',
            description: 'O link de recuperação é inválido ou expirou.',
            variant: 'destructive',
          });
          navigate('/auth', { replace: true });
          return;
        }

        // Se vieram tokens no hash, cria a sessão de recuperação
        if (access_token && refresh_token && type === 'recovery') {
          const { error: sessionErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionErr) throw sessionErr;

          // Limpa o hash da URL para não exibir token
          window.history.replaceState({}, '', '/reset-password');
        } else {
          // Sem tokens no hash? Confere se já existe sessão (pode ter sido criada automaticamente)
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            toast({
              title: 'Link necessário',
              description: 'Acesse através do link enviado por e-mail.',
              variant: 'destructive',
            });
            navigate('/auth', { replace: true });
            return;
          }
        }
      } catch (e: any) {
        toast({
          title: 'Erro ao preparar redefinição',
          description: e?.message || 'Não foi possível validar o link de recuperação.',
          variant: 'destructive',
        });
        navigate('/auth', { replace: true });
        return;
      } finally {
        setInitializing(false);
      }
    };

    prepareRecoverySession();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!password || !confirmPassword) {
      toast({ title: 'Erro', description: 'Preencha todos os campos.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter pelo menos 6 caracteres.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Atualiza a senha usando a sessão de recuperação
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({
        title: 'Senha redefinida!',
        description: 'Faça login com sua nova senha.',
      });

      // Importante: não manter o usuário logado após trocar a senha
      await supabase.auth.signOut();
      navigate('/auth', { replace: true });
    } catch (err: any) {
      toast({
        title: 'Erro ao redefinir senha',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <LoadingSpinner />
            <p className="text-sm text-muted-foreground">Preparando a redefinição de senha...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Redefinir Senha</CardTitle>
          <CardDescription>Digite sua nova senha</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                required
                minLength={6}
                disabled={saving}
              />
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Redefinindo...
                </>
              ) : (
                'Redefinir Senha'
              )}
            </Button>

            <div className="text-center mt-2">
              <Button
                variant="link"
                onClick={() => navigate('/auth')}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Voltar ao login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;