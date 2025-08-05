import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

interface RoleCache {
  userId: string;
  role: UserRole;
  timestamp: number;
}

export function useAuthWithRole() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    loading: true,
  });
  const { toast } = useToast();
  
  // Cache para evitar múltiplas buscas
  const roleCacheRef = useRef<RoleCache | null>(null);
  const isInitializedRef = useRef(false);
  const isFetchingRoleRef = useRef(false);

  console.log('🔄 useAuthWithRole hook initialized');

  // Função estável para buscar role do usuário
  const fetchUserRole = useCallback(async (userId: string): Promise<UserRole | null> => {
    console.log('🔍 fetchUserRole called for userId:', userId);
    
    // Verificar cache primeiro
    if (roleCacheRef.current?.userId === userId) {
      console.log('✅ Using cached role:', roleCacheRef.current.role);
      return roleCacheRef.current.role;
    }

    // Evitar múltiplas chamadas simultâneas
    if (isFetchingRoleRef.current) {
      console.log('⏳ Already fetching role, waiting...');
      return null;
    }

    try {
      isFetchingRoleRef.current = true;
      console.log('🌐 Making API call to get_user_role');
      
      const { data, error } = await supabase.rpc('get_user_role', { 
        user_uuid: userId 
      });

      console.log('📦 User role query result:', { data, error });

      if (error) {
        console.error('❌ Error fetching user role:', error);
        return 'cliente'; // Fallback padrão
      }

      const role = data || 'cliente';
      
      // Atualizar cache
      roleCacheRef.current = {
        userId,
        role,
        timestamp: Date.now()
      };

      console.log('✅ Role fetched and cached:', role);
      return role;
    } catch (error) {
      console.error('❌ Exception in fetchUserRole:', error);
      return 'cliente'; // Fallback padrão
    } finally {
      isFetchingRoleRef.current = false;
    }
  }, []);

  // Função para atualizar estado de auth
  const updateAuthState = useCallback(async (session: Session | null, shouldFetchRole = true) => {
    console.log('🔄 updateAuthState called:', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      shouldFetchRole 
    });
    
    if (session?.user) {
      let role: UserRole | null = null;
      
      if (shouldFetchRole) {
        role = await fetchUserRole(session.user.id);
      } else {
        // Usar role do cache se disponível
        role = roleCacheRef.current?.userId === session.user.id 
          ? roleCacheRef.current.role 
          : null;
      }
      
      console.log('📝 Setting auth state:', { 
        userId: session.user.id, 
        role, 
        loading: false 
      });
      
      setAuthState({
        user: session.user,
        session,
        role,
        loading: false,
      });
    } else {
      console.log('🔄 Clearing auth state');
      roleCacheRef.current = null;
      setAuthState({
        user: null,
        session: null,
        role: null,
        loading: false,
      });
    }
  }, [fetchUserRole]);

  // Effect principal para gerenciar autenticação
  useEffect(() => {
    console.log('🚀 Setting up auth state listener');
    
    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth event received:', event, { hasSession: !!session });
        
        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ User signed in');
            await updateAuthState(session, true);
            break;
            
          case 'SIGNED_OUT':
            console.log('👋 User signed out');
            roleCacheRef.current = null;
            setAuthState({
              user: null,
              session: null,
              role: null,
              loading: false,
            });
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed - updating session only');
            if (session) {
              setAuthState(prev => ({
                ...prev,
                session,
                loading: false,
              }));
            }
            break;
            
          case 'USER_UPDATED':
            console.log('👤 User updated');
            await updateAuthState(session, true);
            break;
            
          default:
            console.log('🔄 Other auth event:', event);
            break;
        }
      }
    );

    // Verificar sessão inicial apenas uma vez
    if (!isInitializedRef.current) {
      console.log('🔍 Checking for existing session');
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('📦 Initial session check:', { hasSession: !!session });
        updateAuthState(session, true);
        isInitializedRef.current = true;
      });
    }

    return () => {
      console.log('🧹 Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []); // Dependências vazias - só executa uma vez

  // Funções de autenticação memoizadas
  const signIn = useCallback(async (email: string, password: string) => {
    console.log('🔐 Sign in attempt for:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      console.log('✅ Sign in successful');
      return { data, error: null };
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      return { data: null, error };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, role: UserRole = 'cliente', businessName?: string) => {
    console.log('📝 Sign up attempt for:', email, 'with role:', role);
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

      // Se usuário confirmado imediatamente, configurar role e negócio
      if (data.user && data.session) {
        setTimeout(async () => {
          try {
            console.log('🔧 Setting up user role and business');
            // Set user role
            const { error: roleError } = await supabase
              .from('user_roles')
              .upsert({ 
                user_id: data.user!.id, 
                role: role 
              });

            if (roleError) {
              console.error('❌ Error setting user role:', roleError);
            }

            // Se é dono de delivery, criar negócio
            if (role === 'dono_delivery' && businessName) {
              const { error: businessError } = await supabase
                .from('delivery_businesses')
                .insert({
                  owner_id: data.user!.id,
                  name: businessName,
                  is_active: true
                });

              if (businessError) {
                console.error('❌ Error creating business:', businessError);
              }
            }
          } catch (error) {
            console.error('❌ Error in post-signup setup:', error);
          }
        }, 100);
      }

      console.log('✅ Sign up successful');
      return { data, error: null };
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      return { data: null, error };
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log('👋 Sign out attempt');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      roleCacheRef.current = null;
      setAuthState({
        user: null,
        session: null,
        role: null,
        loading: false,
      });

      console.log('✅ Sign out successful');
      return { error: null };
    } catch (error: any) {
      console.error('❌ Sign out error:', error);
      return { error };
    }
  }, []);

  const updateUserRole = useCallback(async (newRole: UserRole) => {
    console.log('🔄 Update user role to:', newRole);
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

      // Atualizar cache e estado
      if (roleCacheRef.current) {
        roleCacheRef.current.role = newRole;
      }

      setAuthState(prev => ({
        ...prev,
        role: newRole
      }));

      console.log('✅ User role updated successfully');
      return { error: null };
    } catch (error: any) {
      console.error('❌ Error updating user role:', error);
      return { error };
    }
  }, [authState.user]);

  // Retorno memoizado para evitar re-renders desnecessários
  const returnValue = useMemo(() => ({
    ...authState,
    signIn,
    signUp,
    signOut,
    updateUserRole,
  }), [authState, signIn, signUp, signOut, updateUserRole]);

  console.log('📊 Current auth state:', { 
    hasUser: !!returnValue.user, 
    role: returnValue.role, 
    loading: returnValue.loading 
  });

  return returnValue;
}