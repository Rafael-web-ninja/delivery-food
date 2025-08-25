import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Store, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [userType, setUserType] = useState<'customer' | 'delivery_owner' | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const {
    signUp,
    signIn,
    user,
    loading: authLoading,
    initialized
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    console.log('Auth page: Auth state -', {
      user: user?.email || 'null',
      authLoading,
      initialized
    });

    // Só redirecionar quando a auth estiver inicializada
    if (initialized && !authLoading && user) {
      console.log('Auth page: User authenticated, checking user type for redirect');

      // Verificar tipo de usuário baseado nos metadados
      const userData = user.user_metadata;
      const userType = userData?.user_type;
      if (userType === 'customer') {
        navigate('/meu-perfil', {
          replace: true
        });
      } else if (userType === 'delivery_owner') {
        navigate('/dashboard', {
          replace: true
        });
      } else {
        // Fallback: verificar na database
        checkUserTypeAndRedirect();
      }
    }
  }, [user, authLoading, initialized, navigate]);
  const checkUserTypeAndRedirect = async () => {
    if (!user) return;
    try {
      // Verificar se é dono de delivery
      const {
        data: business
      } = await supabase.from('delivery_businesses').select('id').eq('owner_id', user.id).single();
      if (business) {
        navigate('/dashboard', {
          replace: true
        });
      } else {
        navigate('/meu-perfil', {
          replace: true
        });
      }
    } catch (error) {
      // Se não encontrou business, é cliente
      navigate('/meu-perfil', {
        replace: true
      });
    }
  };
  const handleSignUp = async (e: React.FormEvent, type: 'customer' | 'delivery_owner') => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Preencha email e senha",
        variant: "destructive"
      });
      return;
    }
    if (type === 'delivery_owner' && !businessName) {
      toast({
        title: "Erro",
        description: "Preencha o nome do seu delivery",
        variant: "destructive"
      });
      return;
    }
    if (type === 'customer' && !customerName) {
      toast({
        title: "Erro",
        description: "Preencha seu nome",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    const {
      error
    } = await signUp(email, password, type === 'delivery_owner' ? businessName : customerName, type);
    if (error) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Cadastro realizado!",
        description: "Redirecionando..."
      });

      // Redirecionar para /meu-perfil após cadastro de cliente bem-sucedido
      if (type === 'customer') {
        setTimeout(() => {
          navigate('/meu-perfil', {
            replace: true
          });
        }, 1000);
      }
    }
    setLoading(false);
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Preencha email e senha",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    const {
      error
    } = await signIn(email, password);
    if (error) {
      toast({
        title: "Erro no login",
        description: error.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : error.message,
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast({
        title: "Erro",
        description: "Preencha o email para recuperação",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Usar Supabase Auth nativo para redefinição de senha
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: 'https://app.geracardapio.com/reset-password'
      });

      if (error) {
        throw error;
      }

      setResetEmailSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha",
      });
    } catch (error: any) {
      toast({
        title: "Erro na recuperação",
        description: error.message,
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  // Mostrar loading enquanto a auth não estiver inicializada
  if (!initialized) {
    return <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <LoadingSpinner />
            <p className="text-sm text-muted-foreground">Inicializando...</p>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Gera Cardápio</CardTitle>
          <CardDescription>
            Gerencie seu delivery de forma simples e eficiente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              {!showForgotPassword ? (
                <div className="space-y-4">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required disabled={loading} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" required disabled={loading} />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || authLoading}>
                      {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                  </form>
                  
                  <div className="text-center">
                    <Button 
                      variant="link" 
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      Esqueceu sua senha?
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmailSent(false);
                      setForgotPasswordEmail('');
                    }} 
                    className="mb-4"
                  >
                    ← Voltar ao login
                  </Button>
                  
                  {!resetEmailSent ? (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold">Recuperar Senha</h3>
                        <p className="text-sm text-muted-foreground">
                          Digite seu email para receber um link de recuperação
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="forgot-email">Email</Label>
                        <Input 
                          id="forgot-email" 
                          type="email" 
                          value={forgotPasswordEmail} 
                          onChange={e => setForgotPasswordEmail(e.target.value)} 
                          placeholder="seu@email.com" 
                          required 
                          disabled={loading} 
                        />
                      </div>
                      
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                      </Button>
                    </form>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                        <h3 className="text-lg font-semibold text-success">Email Enviado!</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          Verifique sua caixa de entrada e clique no link para redefinir sua senha.
                        </p>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowForgotPassword(false);
                          setResetEmailSent(false);
                          setForgotPasswordEmail('');
                        }}
                        className="w-full"
                      >
                        Voltar ao Login
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="signup">
              {!userType ? <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-2">Como você quer usar o DeliveryFácil?</h3>
                    <p className="text-sm text-muted-foreground">Escolha o tipo de conta que melhor se adequa ao seu perfil</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <Button variant="outline" className="p-6 h-auto" onClick={() => setUserType('customer')}>
                      <div className="flex flex-col items-center space-y-2">
                        <User className="w-8 h-8 text-primary" />
                        <div className="text-center">
                          <div className="font-semibold">Sou Cliente</div>
                          <div className="text-sm text-muted-foreground">Quero fazer pedidos em deliveries</div>
                        </div>
                      </div>
                    </Button>
                    
                    <Button variant="outline" className="p-6 h-auto" onClick={() => setUserType('delivery_owner')}>
                      <div className="flex flex-col items-center space-y-2">
                        <Store className="w-8 h-8 text-primary" />
                        <div className="text-center">
                          <div className="font-semibold">Sou Dono de Delivery</div>
                          <div className="text-sm text-muted-foreground">Quero gerenciar meu negócio</div>
                        </div>
                      </div>
                    </Button>
                  </div>
                </div> : <div className="space-y-4">
                  <Button variant="ghost" onClick={() => setUserType(null)} className="mb-4">
                    ← Voltar
                  </Button>
                  
                  <form onSubmit={e => handleSignUp(e, userType)} className="space-y-4">
                    {userType === 'delivery_owner' ? <div className="space-y-2">
                        <Label htmlFor="businessName">Nome do seu Delivery</Label>
                        <Input id="businessName" type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Ex: Pizzaria do João" required disabled={loading} />
                      </div> : <div className="space-y-2">
                        <Label htmlFor="customerName">Seu Nome</Label>
                        <Input id="customerName" type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ex: João da Silva" required disabled={loading} />
                      </div>}
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required disabled={loading} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} disabled={loading} />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={loading || authLoading}>
                      {loading ? 'Cadastrando...' : userType === 'delivery_owner' ? 'Cadastrar Delivery' : 'Cadastrar como Cliente'}
                    </Button>
                  </form>
                </div>}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
};
export default Auth;