import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, businessName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  console.log('AuthProvider render start');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  console.log('AuthProvider state initialized');

  // Função estável para atualizar estado de auth
  const updateAuthState = useCallback((newSession: Session | null) => {
    console.log('Auth: Updating state with session:', newSession?.user?.email || 'null');
    setSession(newSession);
    setUser(newSession?.user ?? null);
    setLoading(false);
    setInitialized(true);
  }, []);

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
  }, []); // Remove updateAuthState from dependencies

  const signUp = useCallback(async (email: string, password: string, businessName?: string) => {
    try {
      console.log('Auth: Starting signup for:', email);
      setLoading(true);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            business_name: businessName
          }
        }
      });
      
      if (error) {
        console.error('Auth: Signup error:', error);
        return { error };
      }

      console.log('Auth: Signup successful, attempting auto-login');
      
      // Login automático após cadastro
      if (data.user) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          console.error('Auth: Auto-login failed:', signInError);
          return { error: signInError };
        }
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

  const contextValue = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading,
    initialized
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