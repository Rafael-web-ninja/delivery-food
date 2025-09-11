import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';

const DEBUG = true; // ⬅️ ative/desative logs aqui

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // instala logger de fetch uma única vez
  const fetchHooked = useRef(false);
  useEffect(() => {
    if (!DEBUG || fetchHooked.current) return;

    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : (input as URL).toString();
      const start = Date.now();
      // log só as chamadas potencialmente relevantes (auth/functions) e tudo que for cross-origin
      const isCross = (() => {
        try { return new URL(url).origin !== window.location.origin; } catch { return false; }
      })();
      const important = /auth\/v1|functions\/v1/i.test(url) || isCross;

      if (important) {
        // eslint-disable-next-line no-console
        console.debug('[DEBUG fetch→]', url, init?.method ?? 'GET');
      }

      try {
        const res = await originalFetch(input as any, init);
        if (important) {
          const ct = res.headers.get('content-type') || '';
          const clone = res.clone();
          let peek = '';
          try { peek = (await clone.text()).slice(0, 200); } catch { /* ignore */ }
          // eslint-disable-next-line no-console
          console.debug('[DEBUG fetch←]', res.status, ct, peek.startsWith('<!DOCTYPE') ? '<<HTML>>' : peek);
        }
        return res;
      } catch (err) {
        if (important) {
          // eslint-disable-next-line no-console
          console.debug('[DEBUG fetch ERR]', url, err);
        }
        throw err;
      } finally {
        if (important) {
          // eslint-disable-next-line no-console
          console.debug('[DEBUG fetch⏱️]', url, `${Date.now() - start}ms`);
        }
      }
    };

    fetchHooked.current = true;
    return () => { window.fetch = originalFetch; };
  }, []);

  useEffect(() => {
    // Consome tokens do hash (se houver), cria sessão de recuperação e limpa a URL
    const prepareRecoverySession = async () => {
      try {
        const hashRaw = window.location.hash || '';
        const hash = hashRaw.startsWith('#') ? hashRaw.substring(1) : hashRaw;
        const params = new URLSearchParams(hash);

        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const type = params.get('type');
        const error = params.get('error');

        if (DEBUG) {
          // eslint-disable-next-line no-console
          console.debug('[RESET] location.href', window.location.href);
          // eslint-disable-next-line no-console
          console.debug('[RESET] hash params', { access_token: !!access_token, refresh_token: !!refresh_token, type, error });
        }

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
          const { data: before } = await supabase.auth.getSession();
          if (DEBUG) {
            // eslint-disable-next-line no-console
            console.debug('[RESET] before setSession session?', !!before.session);
          }

          const { data: setData, error: sessionErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionErr) {
            if (DEBUG) console.error('[RESET] setSession error', sessionErr);
            throw sessionErr;
          }
          if (DEBUG) {
            // eslint-disable-next-line no-console
            console.debug('[RESET] setSession ok. user?', !!setData.session?.user?.id, 'exp?', setData.session?.expires_at);
          }

          // Limpa o hash da URL para não exibir token
          window.history.replaceState({}, '', '/reset-password');
        }

        // Confirma sessão (recovery ou normal)
        const { data: after } = await supabase.auth.getSession();
        if (DEBUG) {
          // eslint-disable-next-line no-console
          console.debug('[RESET] after session?', !!after.session, 'provider_token_type?', after.session?.token_type, 'user?', after.session?.user?.id);
        }
        setHasSession(!!after.session);

        if (!after.session) {
          toast({
            title: 'Link necessário',
            description: 'Acesse através do link enviado por e-mail.',
            variant: 'destructive',
          });
          navigate('/auth', { replace: true });
          return;
        }
      } catch (e: any) {
        if (DEBUG) console.error('[RESET] prepare error', e);
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

    // Não tente salvar se não há sessão (evita erro confuso)
    if (hasSession === false) {
      if (DEBUG) console.error('[RESET] Aborting: no session available to update password.');
      toast({
        title: 'Sessão ausente',
        description: 'Abra o link do e-mail novamente para poder redefinir a senha.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (DEBUG) {
        const { data: s } = await supabase.auth.getSession();
        // eslint-disable-next-line no-console
        console.debug('[RESET] about to updateUser. session?', !!s.session, 'user?', s.session?.user?.id);
      }

      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.debug('[RESET] updateUser data', data);
      }

      toast({
        title: 'Senha redefinida!',
        description: 'Faça login com sua nova senha.',
      });

      // Importante: não manter o usuário logado após trocar a senha
      await supabase.auth.signOut();
      navigate('/auth', { replace: true });
    } catch (err: any) {
      if (DEBUG) {
        // coleta mais contexto
        const [{ data: sess }, { data: usr }] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser(),
        ]);
        // eslint-disable-next-line no-console
        console.error('[RESET] updateUser error', err);
        // eslint-disable-next-line no-console
        console.error('[RESET] session now?', !!sess.session, 'user?', sess.session?.user?.id);
        // eslint-disable-next-line no-console
        console.error('[RESET] getUser()', usr?.user?.id, usr?.user?.email);
      }

      // Mensagem amigável para usuário
      let message = err?.message || 'Tente novamente.';
      // Heurística para o caso do <!DOCTYPE ...>
      if (typeof message === 'string' && message.includes('Unexpected token <')) {
        message =
          'Recebemos uma resposta inválida do servidor. Tente atualizar a página. Se persistir, limpe o cache/Service Worker e tente novamente.';
      }

      toast({
        title: 'Erro ao redefinir senha',
        description: message,
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