import { useEffect, useState } from "react";
import { useSession } from "@supabase/auth-helpers-react"; // ajuste conforme o hook usado no Lovable

export default function AuthGate({ children }) {
  const session = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      if (!session) {
        setLoading(false); // se não logado, apenas libera para exibir fallback
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Erro na autenticação:", err);
      setError(err);
      setLoading(false);
    }
  }, [session]);

  if (loading) {
    return <div style={{ padding: 20 }}>Carregando autenticação...</div>;
  }

  if (error) {
    return <div style={{ padding: 20 }}>Falha na autenticação. Recarregue a página.</div>;
  }

  // Se você quer bloquear acesso de não logados:
  // if (!session) return <div>Você não está logado.</div>;

  return <>{children}</>;
}
