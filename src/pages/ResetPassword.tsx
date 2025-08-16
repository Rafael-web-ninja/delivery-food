import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Captura os parâmetros da URL (access_token, refresh_token, etc.)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParamsObj = Object.fromEntries(searchParams.entries());
      
      const accessToken = hashParams.get('access_token') || searchParamsObj.access_token;
      const refreshToken = hashParams.get('refresh_token') || searchParamsObj.refresh_token;
      const tokenType = hashParams.get('type') || searchParamsObj.type;

      console.log('Reset password params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, tokenType });

      if (accessToken && refreshToken && tokenType === 'recovery') {
        try {
          // Estabelece a sessão com os tokens do reset
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Erro ao estabelecer sessão:', error);
            toast({
              title: "Link inválido",
              description: "O link de recuperação é inválido ou expirou",
              variant: "destructive"
            });
            navigate('/auth');
          } else {
            setIsValidSession(true);
            console.log('Sessão estabelecida com sucesso para reset de senha');
          }
        } catch (error) {
          console.error('Erro no processo de reset:', error);
          navigate('/auth');
        }
      } else {
        // Se não há parâmetros de reset, mas o usuário está logado normalmente
        if (user) {
          navigate('/meu-perfil', { replace: true });
        } else {
          toast({
            title: "Link inválido",
            description: "Acesse através do link enviado por email",
            variant: "destructive"
          });
          navigate('/auth');
        }
      }
    };

    handleAuthCallback();
  }, [searchParams, user, navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Senha redefinida!",
        description: "Sua senha foi alterada com sucesso. Redirecionando...",
      });

      // Redireciona após sucesso
      setTimeout(() => {
        navigate('/meu-perfil', { replace: true });
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message,
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  // Mostra loading enquanto verifica a sessão
  if (!isValidSession && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <LoadingSpinner />
            <p className="text-sm text-muted-foreground">Verificando link de recuperação...</p>
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
          <CardDescription>
            Digite sua nova senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
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
                disabled={loading} 
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
                disabled={loading} 
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Redefinindo...
                </>
              ) : (
                'Redefinir Senha'
              )}
            </Button>
          </form>
          
          <div className="text-center mt-4">
            <Button 
              variant="link" 
              onClick={() => navigate('/auth')}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Voltar ao login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;