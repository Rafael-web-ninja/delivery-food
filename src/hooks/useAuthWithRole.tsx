import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'cliente' | 'dono_delivery';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: boolean;
  error: string | null;
}

interface RoleCache {
  userId: string;
  role: UserRole;
  timestamp: number;
  ttl: number;
}

interface UseAuthWithRoleOptions {
  allowedRoles?: UserRole[];
  cacheTTL?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

interface UseAuthWithRoleReturn extends AuthState {
  loading: boolean; // Alias for backward compatibility
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, role?: UserRole, businessName?: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateUserRole: (newRole: UserRole) => Promise<{ error: any }>;
  refresh: () => Promise<void>;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Hook robusto para autenticação e autorização com prevenção de loops infinitos
 * @param options Configurações opcionais (roles permitidos, TTL do cache, etc.)
 * @returns Estado de autenticação e funções de controle
 */
export function useAuthWithRole(options: UseAuthWithRoleOptions = {}): UseAuthWithRoleReturn {
  const {
    allowedRoles = [],
    cacheTTL = CACHE_TTL,
    retryAttempts = MAX_RETRY_ATTEMPTS,
    retryDelay = RETRY_DELAY
  } = options;

  const { toast } = useToast();
  
  // ============= ESTADO E CONTROLE =============
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    isLoading: true,
    isAuthenticated: false,
    hasPermission: false,
    error: null,
  });

  // Flags de controle para evitar loops infinitos
  const controlRef = useRef({
    isInitialized: false,
    isInitializing: false,
    currentUserId: null as string | null,
    mountId: Math.random().toString(36), // ID único por instância
  });

  // Cache de roles com TTL
  const roleCacheRef = useRef<RoleCache | null>(null);
  
  // Controle de requisições
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  console.log(`🔄 [useAuthWithRole:${controlRef.current.mountId}] Hook initialized with options:`, options);

  // ============= UTILIDADES =============
  
  /**
   * Verifica se o cache é válido para o usuário especificado
   */
  const isCacheValid = useCallback((cache: RoleCache | null, userId: string): boolean => {
    if (!cache || cache.userId !== userId) {
      console.log(`📦 [useAuthWithRole:${controlRef.current.mountId}] Cache miss: different user or no cache`);
      return false;
    }
    
    const isExpired = Date.now() - cache.timestamp > cache.ttl;
    if (isExpired) {
      console.log(`⏰ [useAuthWithRole:${controlRef.current.mountId}] Cache expired`);
      return false;
    }
    
    console.log(`✅ [useAuthWithRole:${controlRef.current.mountId}] Cache hit for user:`, userId);
    return true;
  }, []);

  /**
   * Busca role do usuário com cache e retry logic
   */
  const fetchUserRole = useCallback(async (userId: string, attempt = 1): Promise<UserRole | null> => {
    const mountId = controlRef.current.mountId;
    console.log(`🔍 [useAuthWithRole:${mountId}] Fetching role for user ${userId} (attempt ${attempt})`);
    
    // Verificar cache primeiro
    if (isCacheValid(roleCacheRef.current, userId)) {
      return roleCacheRef.current!.role;
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const { data, error } = await supabase.rpc('get_user_role', { 
        user_uuid: userId 
      });

      if (error) {
        throw error;
      }

      const role = data || 'cliente';
      
      // Atualizar cache
      roleCacheRef.current = {
        userId,
        role,
        timestamp: Date.now(),
        ttl: cacheTTL
      };

      console.log(`✅ [useAuthWithRole:${mountId}] Role fetched and cached:`, role);
      return role;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log(`🚫 [useAuthWithRole:${mountId}] Request aborted`);
        return null;
      }

      console.error(`❌ [useAuthWithRole:${mountId}] Error fetching role (attempt ${attempt}):`, error);
      
      // Lógica de retry
      if (attempt < retryAttempts) {
        console.log(`🔄 [useAuthWithRole:${mountId}] Retrying in ${retryDelay}ms...`);
        
        return new Promise((resolve) => {
          retryTimeoutRef.current = setTimeout(async () => {
            const result = await fetchUserRole(userId, attempt + 1);
            resolve(result);
          }, retryDelay);
        });
      }
      
      return 'cliente'; // Fallback role
    }
  }, [isCacheValid, cacheTTL, retryAttempts, retryDelay]);

  /**
   * Atualiza estado de auth de forma segura
   */
  const updateAuthState = useCallback((updates: Partial<AuthState>) => {
    const mountId = controlRef.current.mountId;
    console.log(`📝 [useAuthWithRole:${mountId}] Updating auth state:`, updates);
    
    setAuthState(prev => {
      const newState = { ...prev, ...updates };
      
      // Calcular estados derivados
      newState.isAuthenticated = !!newState.user;
      newState.hasPermission = allowedRoles.length === 0 || 
        (newState.role !== null && allowedRoles.includes(newState.role));
      
      return newState;
    });
  }, [allowedRoles]);

  // ============= INICIALIZAÇÃO =============
  
  useEffect(() => {
    const { isInitialized, isInitializing, mountId } = controlRef.current;
    
    // Evitar re-inicialização
    if (isInitialized || isInitializing) {
      console.log(`⚠️ [useAuthWithRole:${mountId}] Already initialized/initializing, skipping`);
      return;
    }

    console.log(`🚀 [useAuthWithRole:${mountId}] Starting initialization`);
    controlRef.current.isInitializing = true;

    // Setup do listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`🔔 [useAuthWithRole:${mountId}] Auth event:`, event, { hasSession: !!session });
        
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              updateAuthState({ 
                user: session.user, 
                session, 
                isLoading: true, 
                error: null 
              });
              
              // Usar setTimeout para evitar problemas de callback
              setTimeout(async () => {
                console.log(`🔍 [useAuthWithRole:${mountId}] Fetching role for SIGNED_IN user: ${session.user.id}`);
                const role = await fetchUserRole(session.user.id);
                console.log(`✅ [useAuthWithRole:${mountId}] Role fetched for SIGNED_IN: ${role}`);
                updateAuthState({ role, isLoading: false });
                controlRef.current.currentUserId = session.user.id;
              }, 0);
            }
            break;
            
          case 'SIGNED_OUT':
            console.log(`👋 [useAuthWithRole:${mountId}] User signed out, clearing state`);
            roleCacheRef.current = null;
            controlRef.current.currentUserId = null;
            updateAuthState({
              user: null,
              session: null,
              role: null,
              isLoading: false,
              error: null
            });
            break;
            
          case 'USER_UPDATED':
            console.log(`👤 [useAuthWithRole:${mountId}] User updated`);
            if (session?.user) {
              updateAuthState({ user: session.user, session });
              
              // Re-fetch role apenas se o ID do usuário mudou
              if (controlRef.current.currentUserId !== session.user.id) {
                updateAuthState({ isLoading: true });
                setTimeout(async () => {
                  const role = await fetchUserRole(session.user.id);
                  updateAuthState({ role, isLoading: false });
                  controlRef.current.currentUserId = session.user.id;
                }, 0);
              }
            }
            break;
            
          default:
            console.log(`ℹ️ [useAuthWithRole:${mountId}] Unhandled auth event:`, event);
            break;
        }
      }
    );

    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log(`📦 [useAuthWithRole:${mountId}] Initial session check:`, { hasSession: !!session });
      
      if (session?.user) {
        updateAuthState({ 
          user: session.user, 
          session, 
          isLoading: true, 
          error: null 
        });
        
        setTimeout(async () => {
          const role = await fetchUserRole(session.user.id);
          updateAuthState({ role, isLoading: false });
          controlRef.current.currentUserId = session.user.id;
        }, 0);
      } else {
        updateAuthState({ isLoading: false });
      }
      
      controlRef.current.isInitialized = true;
      controlRef.current.isInitializing = false;
    });

    // Cleanup
    return () => {
      console.log(`🧹 [useAuthWithRole:${mountId}] Cleaning up listeners and timers`);
      subscription.unsubscribe();
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []); // Dependências vazias - executa apenas uma vez

  // ============= FUNÇÕES DE AUTENTICAÇÃO =============
  
  const signIn = useCallback(async (email: string, password: string) => {
    const mountId = controlRef.current.mountId;
    console.log(`🔐 [useAuthWithRole:${mountId}] Sign in attempt for:`, email);
    
    try {
      updateAuthState({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      console.log(`✅ [useAuthWithRole:${mountId}] Sign in successful`);
      return { data, error: null };
    } catch (error: any) {
      console.error(`❌ [useAuthWithRole:${mountId}] Sign in error:`, error);
      updateAuthState({ isLoading: false, error: error.message });
      return { data: null, error };
    }
  }, [updateAuthState]);

  const signUp = useCallback(async (
    email: string, 
    password: string, 
    role: UserRole = 'cliente', 
    businessName?: string
  ) => {
    const mountId = controlRef.current.mountId;
    console.log(`📝 [useAuthWithRole:${mountId}] Sign up attempt for:`, email, 'with role:', role);
    
    try {
      updateAuthState({ isLoading: true, error: null });
      
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

      // Setup pós-cadastro
      if (data.user) {
        try {
          console.log(`🔧 [useAuthWithRole:${mountId}] Setting up user role and business`);
          
          // Definir role do usuário
          const { error: roleError } = await supabase
            .from('user_roles')
            .upsert({ 
              user_id: data.user.id, 
              role: role 
            });

          if (roleError) {
            console.error(`❌ [useAuthWithRole:${mountId}] Error setting user role:`, roleError);
            throw new Error(`Erro ao definir role do usuário: ${roleError.message}`);
          }

          // Criar negócio se necessário
          if (role === 'dono_delivery' && businessName) {
            const { error: businessError } = await supabase
              .from('delivery_businesses')
              .insert({
                owner_id: data.user.id,
                name: businessName,
                is_active: true
              });

            if (businessError) {
              console.error(`❌ [useAuthWithRole:${mountId}] Error creating business:`, businessError);
              throw new Error(`Erro ao criar negócio: ${businessError.message}`);
            }
          }

          // Criar perfil para cliente se necessário
          if (role === 'cliente') {
            const { error: profileError } = await supabase
              .from('customer_profiles')
              .insert({
                user_id: data.user.id,
                name: '',
                phone: '',
                address: ''
              });

            if (profileError) {
              console.error(`❌ [useAuthWithRole:${mountId}] Error creating customer profile:`, profileError);
              // Não é um erro crítico, apenas log
            }
          }
        } catch (setupError: any) {
          console.error(`❌ [useAuthWithRole:${mountId}] Error in post-signup setup:`, setupError);
          throw setupError;
        }
      }

      console.log(`✅ [useAuthWithRole:${mountId}] Sign up successful`);
      return { data, error: null };
    } catch (error: any) {
      console.error(`❌ [useAuthWithRole:${mountId}] Sign up error:`, error);
      updateAuthState({ isLoading: false, error: error.message });
      return { data: null, error };
    }
  }, [updateAuthState]);

  const signOut = useCallback(async () => {
    const mountId = controlRef.current.mountId;
    console.log(`👋 [useAuthWithRole:${mountId}] Sign out attempt`);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error(`❌ [useAuthWithRole:${mountId}] Sign out error:`, error);
        return { error };
      }
      
      // Limpar cache e refs - será limpo no listener SIGNED_OUT
      console.log(`✅ [useAuthWithRole:${mountId}] Sign out successful`);
      return { error: null };
    } catch (error: any) {
      console.error(`❌ [useAuthWithRole:${mountId}] Sign out error:`, error);
      return { error };
    }
  }, []);

  const updateUserRole = useCallback(async (newRole: UserRole) => {
    const mountId = controlRef.current.mountId;
    console.log(`🔄 [useAuthWithRole:${mountId}] Update user role to:`, newRole);
    
    if (!authState.user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      updateAuthState({ isLoading: true, error: null });
      
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
        roleCacheRef.current.timestamp = Date.now();
      }

      updateAuthState({ role: newRole, isLoading: false });

      console.log(`✅ [useAuthWithRole:${mountId}] User role updated successfully`);
      return { error: null };
    } catch (error: any) {
      console.error(`❌ [useAuthWithRole:${mountId}] Error updating user role:`, error);
      updateAuthState({ isLoading: false, error: error.message });
      return { error };
    }
  }, [authState.user, updateAuthState]);

  const refresh = useCallback(async () => {
    const mountId = controlRef.current.mountId;
    console.log(`🔄 [useAuthWithRole:${mountId}] Manual refresh requested`);
    
    if (!authState.user) {
      console.log(`⚠️ [useAuthWithRole:${mountId}] No user to refresh`);
      return;
    }

    try {
      updateAuthState({ isLoading: true, error: null });
      
      // Limpar cache para forçar nova busca
      roleCacheRef.current = null;
      
      const role = await fetchUserRole(authState.user.id);
      updateAuthState({ role, isLoading: false });
      
      console.log(`✅ [useAuthWithRole:${mountId}] Manual refresh completed`);
    } catch (error: any) {
      console.error(`❌ [useAuthWithRole:${mountId}] Error during manual refresh:`, error);
      updateAuthState({ isLoading: false, error: error.message });
    }
  }, [authState.user, fetchUserRole, updateAuthState]);

  // ============= VALOR DE RETORNO MEMOIZADO =============
  
  const returnValue = useMemo(() => ({
    ...authState,
    loading: authState.isLoading, // Backward compatibility alias
    signIn,
    signUp,
    signOut,
    updateUserRole,
    refresh,
  }), [authState, signIn, signUp, signOut, updateUserRole, refresh]);

  // Log do estado atual
  console.log(`📊 [useAuthWithRole:${controlRef.current.mountId}] Current state:`, {
    hasUser: !!returnValue.user,
    role: returnValue.role,
    isLoading: returnValue.isLoading,
    isAuthenticated: returnValue.isAuthenticated,
    hasPermission: returnValue.hasPermission,
    error: returnValue.error
  });

  return returnValue;
}