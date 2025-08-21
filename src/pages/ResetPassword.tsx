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
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handlePasswordReset = async () => {
      // Parse URL parameters
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const token = searchParams.get('token') || hashParams.get('access_token');
      const refresh_token = searchParams.get('refresh_token') || hashParams.get('refresh_token');
      const emailParam = searchParams.get('email');
      const type = searchParams.get('type') || hashParams.get('type');
      const error = searchParams.get('error') || hashParams.get('error');
      
      console.log('Reset password params:', { 
        hasToken: !!token, 
        hasRefreshToken: !!refresh_token, 
        email: emailParam || email, 
        type, 
        error,
        pathname: window.location.pathname 
      });

      // Prefill email from URL or current user
      if (emailParam || user?.email) {
        setEmail(emailParam || user?.email || '');
      }

      // Handle errors
      if (error) {
        toast({
          title: "Link inválido",
          description: "O link de recuperação expirou ou é inválido.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      // If no tokens but user is logged in, redirect to profile
      if (!token && user) {
        navigate('/meu-perfil');
        return;
      }

      // If no tokens and no user, redirect to auth
      if (!token) {
        toast({
          title: "Link necessário",
          description: "Acesse através do link enviado por email.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      // Set session with tokens
      try {
        if (token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: refresh_token
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            toast({
              title: "Link inválido",
              description: "O link de recuperação é inválido ou expirou.",
              variant: "destructive"
            });
            navigate('/auth');
            return;
          }
        } else if ((emailParam || email) && type === 'recovery') {
          // Verify OTP for users coming via recovery link without refresh token
          const { error: otpError } = await supabase.auth.verifyOtp({
            token: token!,
            type: 'recovery',
            email: (emailParam || email)!,
          });

          if (otpError) {
            console.error('OTP error:', otpError);
            toast({
              title: "Link inválido",
              description: "Não foi possível verificar o link.",
              variant: "destructive"
            });
            navigate('/auth');
            return;
          }
        }

        setIsValidSession(true);
        console.log('Session established successfully for password reset');
        
        // Clean URL
        window.history.replaceState({}, '', '/reset-password');
        
      } catch (error) {
        console.error('Error setting session:', error);
        navigate('/auth');
      }
    };

    handlePasswordReset();
  }, [navigate, user, toast]);

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
    // Ensure session is valid in case user arrived via recovery link without established session
    if (!isValidSession) {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const token = searchParams.get('token') || hashParams.get('access_token') || '';
      const type = searchParams.get('type') || hashParams.get('type') || 'recovery';
      if (token && email) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'recovery',
        });
        if (otpError) {
          throw otpError;
        }
        setIsValidSession(true);
        // Clean URL after session established
        window.history.replaceState({}, '', '/reset-password');
      }
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    });

      if (error) {
        throw error;
      }

      // Check if this is a new subscription user
      const searchParams = new URLSearchParams(window.location.search);
      const isNewSubscriptionUser = searchParams.get('email') && window.location.pathname === '/reset-password';
      
      toast({
        title: isNewSubscriptionUser ? "Senha definida com sucesso!" : "Senha redefinida!",
        description: isNewSubscriptionUser 
          ? "Sua conta foi criada e senha definida. Bem-vindo!" 
          : "Sua senha foi alterada com sucesso. Redirecionando...",
      });

      // Redirect based on user type
      setTimeout(() => {
        if (isNewSubscriptionUser) {
          navigate('/', { replace: true }); // New subscription users go to dashboard
        } else {
          navigate('/meu-perfil', { replace: true }); // Existing users go to profile
        }
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
          <CardTitle className="text-2xl font-bold">Definir/Redefinir Senha</CardTitle>
          <CardDescription>
            Informe seu email e defina uma nova senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                required
                disabled={loading}
              />
            </div>

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