import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAsyncOperationOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useAsyncOperation<T = any>(options: UseAsyncOperationOptions = {}) {
  const { toast } = useToast();
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { successMessage, errorMessage, onSuccess, onError } = options;

  const execute = useCallback(async (operation: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await operation();
      setState(prev => ({ ...prev, data: result, loading: false }));
      
      if (successMessage) {
        toast({
          title: "Sucesso",
          description: successMessage,
        });
      }
      
      onSuccess?.();
      return result;
    } catch (error: any) {
      const errorMsg = error?.message || errorMessage || 'Ocorreu um erro inesperado';
      setState(prev => ({ ...prev, error: errorMsg, loading: false }));
      
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive",
      });
      
      onError?.(error);
      throw error;
    }
  }, [toast, successMessage, errorMessage, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}