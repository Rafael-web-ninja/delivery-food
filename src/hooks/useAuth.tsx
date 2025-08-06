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
      console.log('Auth: Starting signup for:', email, 'as', userType);
      setLoading(true);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name,
            user_type: userType
          }
        }
      });
      
      if (error) {
        console.error('Auth: Signup error:', error);
        return { error };
      }

      console.log('Auth: Signup successful, attempting auto-login');
      
      // Verificar se o usuário foi criado com sucesso
      if (!data.user) {
        console.error('Auth: User not created');
        return { error: new Error('Usuário não foi criado corretamente') };
      }

      console.log('Auth: User created successfully, ID:', data.user.id);

      // Login automático após cadastro
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        console.error('Auth: Auto-login failed:', signInError);
        return { error: signInError };
      }

      console.log('Auth: Auto-login successful, creating profile...');

      // Criar registro baseado no tipo de usuário - APÓS login bem-sucedido
      try {
        if (userType === 'delivery_owner') {
          // Criar delivery business
          const { error: businessError } = await supabase
            .from('delivery_businesses')
            .insert({
              owner_id: data.user.id,
              name: name || 'Meu Delivery',
              description: 'Descrição do negócio'
            });

          if (businessError) {
            console.error('Auth: Error creating business:', businessError);
            return { error: new Error(`Erro ao criar negócio: ${businessError.message}`) };
          }
          
          console.log('Auth: Delivery business created successfully');
        } else {
          // Garantir que temos o user_id correto
          const authUserId = data.user.id;
          if (!authUserId) {
            return { error: new Error('Erro ao obter ID do usuário autenticado') };
          }

          // Criar perfil do cliente na tabela customer_profiles
          const { data: profileData, error: profileError } = await supabase
            .from('customer_profiles')
            .insert({
              user_id: authUserId, // ✅ Necessário para RLS
              name: name || '',
              phone: '',
              address: ''
            })
            .select()
            .single();

          if (profileError) {
            console.error('Erro ao salvar perfil do cliente:', profileError);
            return { error: new Error(`Erro ao criar perfil: ${profileError.message}`) };
          }
          
          console.log('Novo cliente cadastrado com sucesso:', profileData);
        }
      } catch (dbError) {
        console.error('Auth: Database error after signup:', dbError);
        return { error: new Error(`Erro de banco de dados: ${dbError}`) };
      }
      
      return { error: null };
    } catch (error) {
      console.error('Auth: Signup exception:', error);
      return { error };
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
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Auth: Signout error:', error);
      } else {
        console.log('Auth: Signout successful');
      }
    } catch (error) {
      console.error('Auth: Signout exception:', error);
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