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

  const execute = useCallback(async (operation: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await operation();
      setState(prev => ({ ...prev, data: result, loading: false }));
      
      if (options.successMessage) {
        toast({
          title: "Sucesso",
          description: options.successMessage,
        });
      }
      
      options.onSuccess?.();
      return result;
    } catch (error: any) {
      const errorMessage = error?.message || options.errorMessage || 'Ocorreu um erro inesperado';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      
      options.onError?.(error);
      throw error;
    }
  }, [toast, options]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}