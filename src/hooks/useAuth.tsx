import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, name?: string, userType?: 'customer' | 'delivery_owner') => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // ALL HOOKS MUST BE CALLED AT THE TOP - NO CONDITIONAL HOOKS
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // STABLE CALLBACKS - NO DEPENDENCIES THAT CHANGE
  const signUp = useCallback(async (email: string, password: string, name?: string, userType: 'customer' | 'delivery_owner' = 'customer') => {
    try {
      // Validação de senha
      if (password.length < 6) {
        return { error: new Error('A senha deve ter pelo menos 6 caracteres') };
      }

      console.log('Auth: Starting signup for:', email);
      setLoading(true);
      
      // 1. Tentar criar usuário no Supabase Auth (método padrão)
      let signupData: { user: User | null } | undefined;
      let signupError: any;
      let createdUserId: string | null = null;
      
      try {
        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name: name, user_type: userType }
          }
        });
        signupData = { user: result.data.user } as any;
        signupError = result.error;
        if (!signupError) {
          createdUserId = result.data.user?.id ?? null;
        }
      } catch (authError: any) {
        console.error('Erro no signup padrão:', authError);
        signupError = authError;
      }
      
      // 2. Tratar erros específicos
      if (signupError) {
        console.error('Erro ao criar usuário Auth:', signupError);
        
        const msg = String(signupError.message || signupError.error_description || signupError.error || '');
        if (msg.includes('already registered') || msg.includes('already exists')) {
          return { error: new Error('Email já cadastrado') };
        }
        if (msg.includes('Invalid email') || msg.toLowerCase().includes('invalid email')) {
          return { error: new Error('Email inválido') };
        }
        if (msg.toLowerCase().includes('weak password') || msg.toLowerCase().includes('password')) {
          return { error: new Error('Senha muito fraca. Use pelo menos 6 caracteres') };
        }
        
        // Fallback: alguns projetos falham com "Database error saving new user"
        if (msg.includes('Database error')) {
          console.warn('Detectado erro de database no signup. Tentando login e prosseguir...');
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) {
            console.error('Falha no fallback de login:', signInError);
            return { error: new Error('Erro interno, tente novamente em alguns minutos') };
          }
          createdUserId = signInData.user?.id ?? null;
        } else {
          return { error: new Error('Erro interno, tente novamente em alguns minutos') };
        }
      }

      // 3. Verificar se o usuário foi criado
      const userId = createdUserId ?? signupData?.user?.id ?? null;
      if (!userId) {
        console.error('Não foi possível obter o ID do usuário criado.');
        return { error: new Error('Erro interno, tente novamente em alguns minutos') };
      }

      console.log('Novo usuário (ou sessão) obtido:', userId);

      // 5. Criar perfil baseado no tipo de usuário
      try {
        if (userType === 'delivery_owner') {
          const { error: businessError } = await supabase
            .from('delivery_businesses')
            .insert({
              owner_id: userId,
              name: name || 'Meu Delivery',
              description: 'Descrição do negócio'
            });

          if (businessError) {
            console.error('Erro ao salvar negócio:', businessError);
            return { error: new Error('Erro ao criar perfil do negócio') };
          }
          
          console.log('Negócio criado com sucesso');
        } else {
          // Criar perfil do cliente (idempotente)
          // Verifica se já existe para evitar erros de duplicidade quando triggers já criaram o perfil
          const { data: existingProfile, error: existingCheckError } = await supabase
            .from('customer_profiles')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          if (!existingCheckError && existingProfile) {
            console.log('Perfil do cliente já existe, pulando criação');
          } else {
            const attemptCreateProfile = async () => {
              const { error: profileError } = await supabase
                .from('customer_profiles')
                .insert({
                  user_id: userId,
                  name: name || 'Novo Cliente',
                  phone: '',
                  address: ''
                });
              return profileError;
            };

            let profileError = await attemptCreateProfile();
            if (profileError) {
              // Ignora duplicidade se o perfil foi criado por trigger
              const msg = String(profileError.message || '');
              if (msg.includes('duplicate key value')) {
                console.warn('Perfil já existia (duplicado), seguindo em frente');
              } else if (msg.includes('row-level security') || msg.includes('RLS')) {
                try {
                  await supabase.auth.signInWithPassword({ email, password });
                  await new Promise((resolve) => setTimeout(resolve, 500));
                  profileError = await attemptCreateProfile();
                  if (profileError && !String(profileError.message || '').includes('duplicate key value')) {
                    console.error('Erro ao salvar perfil na segunda tentativa:', profileError);
                    return { error: new Error('Erro ao criar perfil do cliente') };
                  }
                } catch (loginError) {
                  console.error('Erro no login automático:', loginError);
                  return { error: new Error('Erro ao criar perfil do cliente') };
                }
              } else {
                return { error: new Error('Erro ao criar perfil do cliente') };
              }
            }
            console.log('Perfil do cliente criado com sucesso');
          }
        }
      } catch (dbError) {
        console.error('Erro de banco de dados:', dbError);
        return { error: new Error('Erro interno, tente novamente em alguns minutos') };
      }
      
      console.log('Cadastro realizado com sucesso!');
      return { error: null };
    } catch (error) {
      console.error('Erro geral no cadastro:', error);
      return { error: new Error('Erro interno, tente novamente em alguns minutos') };
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      console.log('Auth: Starting signin for:', email);
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Auth: Signin error:', error);
      } else {
        console.log('Auth: Signin successful');
      }
      
      return { error };
    } catch (error) {
      console.error('Auth: Signin exception:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('Auth: Starting signout');
      setLoading(true);
      
      // Clear state immediately
      setUser(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Auth: Signout error:', error);
        throw error;
      } else {
        console.log('Auth: Signout successful');
        // Redirect to home page after successful logout
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Auth: Signout exception:', error);
      // Even if there's an error, clear local state and redirect
      setUser(null);
      setSession(null);
      window.location.href = '/';
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // EFFECT WITH NO DEPENDENCIES TO PREVENT LOOPS
  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      try {
        console.log('Auth: Initializing...');
        
        // Verificar sessão existente
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth: Error getting session:', error);
          if (mounted) {
            setSession(null);
            setUser(null);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          setInitialized(true);
        }

        // Configurar listener de mudanças de auth - APENAS UMA VEZ
        if (!authSubscription) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, newSession) => {
              console.log('Auth: State change event:', event, newSession?.user?.email || 'null');
              
              // Ignorar eventos INITIAL_SESSION para evitar loops
              if (event === 'INITIAL_SESSION') {
                return;
              }
              
              if (mounted) {
                setSession(newSession);
                setUser(newSession?.user ?? null);
                setLoading(false);
                setInitialized(true);
              }
            }
          );
          authSubscription = subscription;
        }

      } catch (error) {
        console.error('Auth: Initialization failed:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []); // NO DEPENDENCIES TO PREVENT INFINITE LOOPS

  // CONTEXT VALUE WITH STABLE REFERENCES
  const contextValue = {
    user: user ?? null,
    session: session ?? null,
    signUp,
    signIn,
    signOut,
    loading: Boolean(loading),
    initialized: Boolean(initialized)
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};