import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'cliente' | 'dono_delivery';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
}

export function useAuthWithRole() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    loading: true,
  });
  const { toast } = useToast();
  const lastFetchedUserId = useRef<string | null>(null);

  const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      console.log('Fetching user role for userId:', userId);
      
      // Usar a função SQL existente que já tem fallback
      const { data, error } = await supabase.rpc('get_user_role', { 
        user_uuid: userId 
      });

      console.log('User role query result:', { data, error });

      if (error) {
        console.error('Error fetching user role:', error);
        return 'cliente'; // Fallback padrão
      }

      return data || 'cliente';
    } catch (error) {
      console.error('Error fetching user role:', error);
      return 'cliente'; // Fallback padrão
    }
  };

  const updateAuthState = async (session: Session | null) => {
    console.log('Updating auth state with session:', !!session);
    
    if (session?.user) {
      // Evitar múltiplas buscas para o mesmo usuário
      if (lastFetchedUserId.current === session.user.id) {
        console.log('User role already fetched, updating session only');
        setAuthState(prev => ({
          ...prev,
          user: session.user,
          session,
          loading: false,
        }));
        return;
      }

      try {
        const role = await fetchUserRole(session.user.id);
        console.log('Setting auth state with role:', role);
        lastFetchedUserId.current = session.user.id;
        
        setAuthState({
          user: session.user,
          session,
          role,
          loading: false,
        });
      } catch (error) {
        console.error('Error updating auth state:', error);
        lastFetchedUserId.current = session.user.id;
        // Mesmo em erro, definir loading como false
        setAuthState({
          user: session.user,
          session,
          role: 'cliente',
          loading: false,
        });
      }
    } else {
      console.log('No session, setting auth state to null');
      lastFetchedUserId.current = null;
      setAuthState({
        user: null,
        session: null,
        role: null,
        loading: false,
      });
    }
  };

  useEffect(() => {
    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        // Só buscar role em eventos que alteram o usuário logado
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          await updateAuthState(session);
        } else if (event === 'SIGNED_OUT') {
          lastFetchedUserId.current = null;
          setAuthState({
            user: null,
            session: null,
            role: null,
            loading: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Para renovação de token, apenas atualizar a sessão sem buscar role
          setAuthState(prev => ({
            ...prev,
            session,
            loading: false,
          }));
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, role: UserRole = 'cliente', businessName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        throw error;
      }

      // If user is confirmed immediately, set their role and create business if needed
      if (data.user && data.session) {
        setTimeout(async () => {
          try {
            // Set user role
            const { error: roleError } = await supabase
              .from('user_roles')
              .upsert({ 
                user_id: data.user!.id, 
                role: role 
              });

            if (roleError) {
              console.error('Error setting user role:', roleError);
            }

            // If it's a delivery owner, create the business
            if (role === 'dono_delivery' && businessName) {
              const { error: businessError } = await supabase
                .from('delivery_businesses')
                .insert({
                  owner_id: data.user!.id,
                  name: businessName,
                  is_active: true
                });

              if (businessError) {
                console.error('Error creating business:', businessError);
              }
            }
          } catch (error) {
            console.error('Error in post-signup setup:', error);
          }
        }, 100);
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      setAuthState({
        user: null,
        session: null,
        role: null,
        loading: false,
      });

      return { error: null };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  const updateUserRole = async (newRole: UserRole) => {
    if (!authState.user) return { error: new Error('User not authenticated') };

    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: authState.user.id, 
          role: newRole 
        });

      if (error) {
        throw error;
      }

      setAuthState(prev => ({
        ...prev,
        role: newRole
      }));

      return { error: null };
    } catch (error: any) {
      console.error('Error updating user role:', error);
      return { error };
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    updateUserRole,
  };
}