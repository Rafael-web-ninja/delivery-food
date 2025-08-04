import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AuthGateProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthGate({ children, requireAuth = true }: AuthGateProps) {
  const { user, loading, initialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && initialized && requireAuth && !user) {
      navigate("/auth");
    }
  }, [loading, initialized, requireAuth, user, navigate]);

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
