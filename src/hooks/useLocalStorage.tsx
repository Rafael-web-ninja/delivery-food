import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Estado para armazenar o valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Busca do localStorage
      const item = window.localStorage.getItem(key);
      // Parse do JSON armazenado ou retorna o valor inicial
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // Se erro ao fazer parse do JSON, retorna valor inicial
      console.error(`Erro ao ler localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Retorna uma versão wrapped do setter de useState que também persiste no localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permite que value seja uma função para ter a mesma API do useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Salva no estado
      setStoredValue(valueToStore);
      // Salva no localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // Um error mais avançado pode ser implementado aqui
      console.error(`Erro ao salvar no localStorage key "${key}":`, error);
    }
  };

  // Remove item do localStorage
  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Erro ao remover localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue] as const;
}

// Hook para preferências do usuário
export function useUserPreferences() {
  const [preferences, setPreferences, clearPreferences] = useLocalStorage('user_preferences', {
    theme: 'light' as 'light' | 'dark',
    notifications: true,
    sound: true,
    language: 'pt-BR',
  });

  const updatePreference = <K extends keyof typeof preferences>(
    key: K,
    value: typeof preferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return {
    preferences,
    updatePreference,
    clearPreferences,
  };
}